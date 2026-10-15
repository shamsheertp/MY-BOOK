import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { Prisma, ExpenseStatus } from '@prisma/client';
import { serverCache } from '../utils/cache.js';

export const STANDARD_EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Utilities',
  'Rent & Lease',
  'Internet & Telephone',
  'Fuel & Transportation',
  'Maintenance & Repairs',
  'Employee Salaries',
  'Taxes & Licenses',
  'Software Subscriptions',
  'Travel',
  'Meals & Entertainment',
  'Marketing & Advertising',
];

export const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

export const createExpenseSchema = z.object({
  ref: z.string().optional(),
  date: z.string().or(z.date()).optional(),
  category: z.string().min(1, 'Category is required'),
  categoryId: z.string().optional().nullable(),
  amount: z.union([
    z.number(),
    z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
  ]).refine((val) => Number(val) > 0, 'Amount must be greater than 0'),
  tax: z.union([
    z.number(),
    z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
  ]).optional().default(0),
  paymentMethod: z.string().optional().default('Credit Card'),
  paymentMethodId: z.string().optional().nullable(),
  status: z.preprocess((val) => {
    if (typeof val === 'string') {
      const upper = val.toUpperCase().trim();
      if (upper === 'PAID') return ExpenseStatus.PAID;
      if (upper === 'PENDING') return ExpenseStatus.PENDING;
      if (upper === 'VOID' || upper === 'VOIDED') return ExpenseStatus.VOID;
      if (upper === 'CANCELLED' || upper === 'CANCELED') return ExpenseStatus.CANCELLED;
    }
    return val;
  }, z.nativeEnum(ExpenseStatus)).optional().default(ExpenseStatus.PAID),
  description: z.string().optional().nullable(),
  payee: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  referenceNo: z.string().optional().nullable(),
  receiptImage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateExpenseSchema = z.object({
  ref: z.string().optional(),
  date: z.string().or(z.date()).optional(),
  category: z.string().min(1).optional(),
  categoryId: z.string().optional().nullable(),
  amount: z.union([
    z.number(),
    z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
  ]).refine((val) => Number(val) > 0, 'Amount must be greater than 0').optional(),
  tax: z.union([
    z.number(),
    z.string().regex(/^\d+(\.\d+)?$/).transform(Number),
  ]).optional(),
  paymentMethod: z.string().optional(),
  paymentMethodId: z.string().optional().nullable(),
  status: z.preprocess((val) => {
    if (typeof val === 'string') {
      const upper = val.toUpperCase().trim();
      if (upper === 'PAID') return ExpenseStatus.PAID;
      if (upper === 'PENDING') return ExpenseStatus.PENDING;
      if (upper === 'VOID' || upper === 'VOIDED') return ExpenseStatus.VOID;
      if (upper === 'CANCELLED' || upper === 'CANCELED') return ExpenseStatus.CANCELLED;
    }
    return val;
  }, z.nativeEnum(ExpenseStatus)).optional(),
  description: z.string().optional().nullable(),
  payee: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  referenceNo: z.string().optional().nullable(),
  receiptImage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  pin: z.string().optional(),
});

export const voidExpenseSchema = z.object({
  pin: z.string().min(1, 'Admin PIN is required'),
  reason: z.string().optional(),
});

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().nullable(),
  color: z.string().optional(),
});

export const updateExpenseCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional(),
});

/**
 * Generate next unique EXP-XXX code
 */
export async function generateNextExpenseRef(): Promise<string> {
  const lastExp = await prisma.expense.findFirst({
    where: {
      ref: {
        startsWith: 'EXP-',
      },
    },
    orderBy: { ref: 'desc' },
    select: { ref: true },
  });

  let nextNum = 1;
  if (lastExp?.ref) {
    const match = lastExp.ref.match(/EXP-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }
  }

  return `EXP-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Format expense for API response
 */
function formatExpense(expense: any) {
  const formattedStatus = expense.status === ExpenseStatus.PAID 
    ? 'Paid' 
    : expense.status === ExpenseStatus.PENDING 
      ? 'Pending' 
      : expense.status === ExpenseStatus.VOID 
        ? 'Void' 
        : 'Cancelled';
  return {
    ...expense,
    amount: Number(expense.amount),
    tax: Number(expense.tax || 0),
    status: formattedStatus,
    rawStatus: expense.status,
    voided: Boolean(expense.voided || expense.status === ExpenseStatus.VOID),
    date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
  };
}

/**
 * Get all expenses with filtering, search, pagination, and totals
 */
export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      status,
      dateFrom,
      dateTo,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const where: Prisma.ExpenseWhereInput = {};

    // Search filter across ref, description, category, payee, referenceNo
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { ref: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { payee: { contains: q, mode: 'insensitive' } },
        { referenceNo: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Category filter
    if (category && typeof category === 'string' && category !== 'All') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    // Status filter
    if (status && typeof status === 'string' && status !== 'All') {
      const upper = status.toUpperCase().trim();
      if (upper === 'PAID') where.status = ExpenseStatus.PAID;
      else if (upper === 'PENDING') where.status = ExpenseStatus.PENDING;
      else if (upper === 'CANCELLED' || upper === 'CANCELED') where.status = ExpenseStatus.CANCELLED;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom && typeof dateFrom === 'string') {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo && typeof dateTo === 'string') {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.date.lte = to;
      }
    }

    // Determine sort
    const validSortFields = ['date', 'amount', 'ref', 'createdAt', 'category'];
    const sortField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'date';
    const sortDirection = (sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const [totalRecords, expensesList, allFilteredExpenses] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortDirection },
        include: {
          contact: {
            select: {
              id: true,
              contactName: true,
              companyName: true,
              phone: true,
              email: true,
            },
          },
          expenseCategory: true,
          paymentMethodRel: true,
        },
      }),
      prisma.expense.findMany({
        where,
        select: { amount: true, status: true },
      }),
    ]);

    // Compute summary metrics for current filtered query
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;

    for (const exp of allFilteredExpenses) {
      const amt = Number(exp.amount) || 0;
      totalAmount += amt;
      if (exp.status === ExpenseStatus.PAID) {
        paidAmount += amt;
      } else if (exp.status === ExpenseStatus.PENDING) {
        pendingAmount += amt;
      }
    }

    const formattedExpenses = expensesList.map(formatExpense);

    res.json({
      success: true,
      data: {
        expenses: formattedExpenses,
        pagination: {
          total: totalRecords,
          page,
          limit,
          totalPages: Math.ceil(totalRecords / limit),
        },
        summary: {
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          paidAmount: parseFloat(paidAmount.toFixed(2)),
          pendingAmount: parseFloat(pendingAmount.toFixed(2)),
          count: totalRecords,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get expense summary & analytics
 */
export const getExpenseSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        category: true,
        status: true,
        date: true,
      },
    });

    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;

    const categoryMap: Record<string, { total: number; count: number }> = {};
    const monthlyMap: Record<number, number> = {};

    for (let m = 0; m < 12; m++) {
      monthlyMap[m] = 0;
    }

    for (const exp of expenses) {
      const amt = Number(exp.amount) || 0;
      totalAmount += amt;

      if (exp.status === ExpenseStatus.PAID) paidAmount += amt;
      else if (exp.status === ExpenseStatus.PENDING) pendingAmount += amt;

      // Category breakdown
      const cat = exp.category || 'Uncategorized';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, count: 0 };
      }
      categoryMap[cat].total += amt;
      categoryMap[cat].count += 1;

      // Monthly breakdown
      const month = new Date(exp.date).getMonth();
      monthlyMap[month] = (monthlyMap[month] || 0) + amt;
    }

    const categoryBreakdown = Object.entries(categoryMap).map(([name, data]) => ({
      category: name,
      amount: parseFloat(data.total.toFixed(2)),
      count: data.count,
      percentage: totalAmount > 0 ? parseFloat(((data.total / totalAmount) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.amount - a.amount);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyBreakdown = months.map((monthName, idx) => ({
      month: monthName,
      monthIndex: idx + 1,
      amount: parseFloat((monthlyMap[idx] || 0).toFixed(2)),
    }));

    res.json({
      success: true,
      data: {
        year,
        totalExpenses: parseFloat(totalAmount.toFixed(2)),
        totalCount: expenses.length,
        paidExpenses: parseFloat(paidAmount.toFixed(2)),
        pendingExpenses: parseFloat(pendingAmount.toFixed(2)),
        categoryBreakdown,
        monthlyBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all expense categories (from DB or initialized defaults)
 */
export const getExpenseCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    // If categories table is empty, auto-seed defaults
    if (categories.length === 0) {
      const seedData = STANDARD_EXPENSE_CATEGORIES.map((name) => ({
        name,
        isDefault: true,
      }));

      await prisma.expenseCategory.createMany({
        data: seedData,
        skipDuplicates: true,
      });

      categories = await prisma.expenseCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { expenses: true },
          },
        },
      });
    }

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new expense category
 */
export const createExpenseCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, color } = req.body;

    const existing = await prisma.expenseCategory.findUnique({
      where: { name },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Expense category '${name}' already exists`,
      });
      return;
    }

    const newCategory = await prisma.expenseCategory.create({
      data: {
        name,
        description,
        color: color || '#6366f1',
      },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    serverCache.invalidate(['expenses', 'reports', 'ledgers']);

    res.status(201).json({
      success: true,
      message: 'Expense category created successfully',
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing expense category
 */
export const updateExpenseCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, description, color } = req.body;

    const existing = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Expense category not found',
      });
      return;
    }

    if (name && name !== existing.name) {
      const duplicate = await prisma.expenseCategory.findUnique({
        where: { name },
      });
      if (duplicate) {
        res.status(409).json({
          success: false,
          message: `Expense category '${name}' already exists`,
        });
        return;
      }

      // Sync category string name on existing expenses
      await prisma.expense.updateMany({
        where: { categoryId: id },
        data: { category: name },
      });
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
      },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    serverCache.invalidate(['expenses', 'reports', 'ledgers']);

    res.json({
      success: true,
      message: 'Expense category updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an expense category
 */
export const deleteExpenseCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.expenseCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Expense category not found',
      });
      return;
    }

    // Safely unlink expenses pointing to this category ID
    await prisma.expense.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.expenseCategory.delete({
      where: { id },
    });

    serverCache.invalidate(['expenses', 'reports', 'ledgers']);

    res.json({
      success: true,
      message: 'Expense category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single expense by ID or reference code
 */
export const getExpenseById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const expense = await prisma.expense.findFirst({
      where: {
        OR: [
          { id },
          { ref: id },
        ],
      },
      include: {
        contact: {
          select: {
            id: true,
            code: true,
            contactName: true,
            companyName: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        expenseCategory: true,
        paymentMethodRel: true,
      },
    });

    if (!expense) {
      res.status(404).json({
        success: false,
        message: `Expense '${id}' not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: formatExpense(expense),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new expense
 */
export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body;

    // Auto-generate reference number if not provided
    const ref = body.ref && body.ref.trim().length > 0 ? body.ref.trim() : await generateNextExpenseRef();

    // Parallelize reference existence check and contact verification
    const [existing, contactExists] = await Promise.all([
      prisma.expense.findUnique({ where: { ref }, select: { id: true } }),
      body.contactId ? prisma.contact.findUnique({ where: { id: body.contactId }, select: { id: true } }) : Promise.resolve(true),
    ]);

    if (existing) {
      res.status(409).json({
        success: false,
        message: `Expense with reference '${ref}' already exists`,
      });
      return;
    }

    if (body.contactId && !contactExists) {
      res.status(404).json({
        success: false,
        message: `Contact with ID '${body.contactId}' not found`,
      });
      return;
    }

    // Parse date
    const expenseDate = body.date ? new Date(body.date) : new Date();

    const createdExpense = await prisma.expense.create({
      data: {
        ref,
        date: expenseDate,
        category: body.category,
        amount: new Prisma.Decimal(body.amount),
        tax: new Prisma.Decimal(body.tax || 0),
        paymentMethod: body.paymentMethod || 'Credit Card',
        status: body.status || ExpenseStatus.PAID,
        description: body.description || null,
        payee: body.payee || null,
        referenceNo: body.referenceNo || null,
        receiptImage: body.receiptImage || null,
        notes: body.notes || null,
        createdById: (req as any).user?.id || null,
        ...(body.contactId ? { contact: { connect: { id: body.contactId } } } : {}),
        ...(body.categoryId ? { expenseCategory: { connect: { id: body.categoryId } } } : {}),
        ...(body.paymentMethodId ? { paymentMethodRel: { connect: { id: body.paymentMethodId } } } : {}),
      },
      include: {
        contact: true,
        expenseCategory: true,
        paymentMethodRel: true,
      },
    });

    serverCache.invalidate(['expenses', 'reports', 'ledgers']);

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: formatExpense(createdExpense),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing expense
 */
export const updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const body = req.body;

    const existing = await prisma.expense.findFirst({
      where: {
        OR: [{ id }, { ref: id }],
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Expense '${id}' not found`,
      });
      return;
    }

    // Disallow updates to voided expenses
    if (existing.voided || existing.status === ExpenseStatus.VOID) {
      res.status(400).json({
        success: false,
        message: `Cannot edit expense '${existing.ref}' because it has been voided.`,
      });
      return;
    }

    // Verify Admin PIN if provided
    const providedPin = body.pin || req.headers['x-admin-pin'];
    if (providedPin && providedPin !== ADMIN_PIN) {
      res.status(403).json({
        success: false,
        message: 'Incorrect Admin PIN. Access Denied.',
      });
      return;
    }

    // If changing ref, ensure uniqueness
    if (body.ref && body.ref !== existing.ref) {
      const duplicateRef = await prisma.expense.findUnique({
        where: { ref: body.ref },
      });
      if (duplicateRef) {
        res.status(409).json({
          success: false,
          message: `Expense with reference '${body.ref}' already exists`,
        });
        return;
      }
    }

    // Verify contact if contactId changed
    if (body.contactId && body.contactId !== existing.contactId) {
      const contactExists = await prisma.contact.findUnique({
        where: { id: body.contactId },
      });
      if (!contactExists) {
        res.status(404).json({
          success: false,
          message: `Contact with ID '${body.contactId}' not found`,
        });
        return;
      }
    }

    const updateData: Prisma.ExpenseUpdateInput = {};

    if (body.ref !== undefined) updateData.ref = body.ref;
    if (body.date !== undefined) updateData.date = new Date(body.date);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.amount !== undefined) updateData.amount = new Prisma.Decimal(body.amount);
    if (body.tax !== undefined) updateData.tax = new Prisma.Decimal(body.tax);
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.payee !== undefined) updateData.payee = body.payee;
    if (body.referenceNo !== undefined) updateData.referenceNo = body.referenceNo;
    if (body.receiptImage !== undefined) updateData.receiptImage = body.receiptImage;
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (body.contactId !== undefined) {
      updateData.contact = body.contactId ? { connect: { id: body.contactId } } : { disconnect: true };
    }
    if (body.categoryId !== undefined) {
      updateData.expenseCategory = body.categoryId ? { connect: { id: body.categoryId } } : { disconnect: true };
    }
    if (body.paymentMethodId !== undefined) {
      updateData.paymentMethodRel = body.paymentMethodId ? { connect: { id: body.paymentMethodId } } : { disconnect: true };
    }

    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        contact: true,
        expenseCategory: true,
        paymentMethodRel: true,
      },
    });

    serverCache.invalidate(['expenses', 'reports', 'ledgers']);

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: formatExpense(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Void an expense (Requires Admin PIN)
 */
export const voidExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { pin, reason } = req.body;

    if (pin !== ADMIN_PIN) {
      res.status(403).json({
        success: false,
        message: 'Incorrect Admin PIN. Access Denied.',
      });
      return;
    }

    const existing = await prisma.expense.findFirst({
      where: {
        OR: [{ id }, { ref: id }],
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Expense '${id}' not found`,
      });
      return;
    }

    if (existing.voided || existing.status === ExpenseStatus.VOID) {
      res.status(400).json({
        success: false,
        message: `Expense '${existing.ref}' has already been voided`,
      });
      return;
    }

    const updated = await prisma.expense.update({
      where: { id: existing.id },
      data: {
        status: ExpenseStatus.VOID,
        voided: true,
        voidedAt: new Date(),
        voidReason: reason || 'Voided by Admin',
      },
      include: {
        contact: true,
      },
    });

    serverCache.invalidate(['expenses', 'reports', 'ledgers']);

    res.json({
      success: true,
      message: `Expense '${existing.ref}' voided successfully`,
      data: formatExpense(updated),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.expense.findFirst({
      where: {
        OR: [{ id }, { ref: id }],
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: `Expense '${id}' not found`,
      });
      return;
    }

    await prisma.expense.delete({
      where: { id: existing.id },
    });

    serverCache.invalidate(['expenses', 'reports', 'ledgers']);

    res.json({
      success: true,
      message: `Expense '${existing.ref}' deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};
