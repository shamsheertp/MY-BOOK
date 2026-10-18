import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { Prisma } from '@prisma/client';
import { serverCache } from '../utils/cache.js';

export const createContactSchema = z.object({
  code: z.string().optional(),
  contactName: z.string().min(1, 'Contact name is required'),
  companyName: z.string().optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receivables: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional().default(0),
  payables: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional().default(0),
  avatar: z.string().optional().nullable(),
});

export const updateContactSchema = z.object({
  code: z.string().optional(),
  contactName: z.string().min(1).optional(),
  companyName: z.string().optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  receivables: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  payables: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  avatar: z.string().optional().nullable(),
});

/**
 * Generate next unique CONT-XXX code
 */
async function generateNextCode(): Promise<string> {
  const contacts = await prisma.contact.findMany({
    where: {
      code: {
        startsWith: 'CONT-',
      },
    },
    select: { code: true },
  });

  let maxNum = 0;
  for (const c of contacts) {
    if (c.code) {
      const match = c.code.match(/CONT-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return `CONT-${String(nextNum).padStart(3, '0')}`;
}

/**
 * GET /api/contacts
 * Retrieve paginated and filtered contacts list
 */
export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const search = (req.query.search as string)?.trim();
    const hasOutstanding = req.query.hasOutstanding === 'true';

    const where: Prisma.ContactWhereInput = {};

    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hasOutstanding) {
      where.OR = [
        { receivables: { gt: 0 } },
        { payables: { gt: 0 } },
      ];
    }

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Aggregate summary numbers
    const aggregate = await prisma.contact.aggregate({
      _sum: {
        receivables: true,
        payables: true,
      },
    });

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        summary: {
          totalReceivables: Number(aggregate._sum.receivables || 0),
          totalPayables: Number(aggregate._sum.payables || 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/contacts/:id
 * Retrieve a single contact by ID or CONT code
 */
export const getContactById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { id },
          { code: id },
        ],
      },
    });

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: { contact },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/contacts
 * Create a new contact
 */
export const createContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;

    const code = data.code?.trim() || (await generateNextCode());

    // Generate avatar seed if not provided
    const initials = data.contactName
      .trim()
      .split(/\s+/)
      .map((part: string) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'CO';

    const avatar =
      data.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${initials}&backgroundColor=e0e7ff&textColor=4f46e5`;

    const contact = await prisma.contact.create({
      data: {
        code,
        contactName: data.contactName.trim(),
        companyName: data.companyName?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        taxNumber: data.taxNumber?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        receivables: data.receivables || 0,
        payables: data.payables || 0,
        avatar,
      },
    });

    serverCache.invalidate(['contacts', 'sales', 'purchases']);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully.',
      data: { contact },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'A contact with this code or unique field already exists.',
      });
      return;
    }
    next(error);
  }
};

/**
 * PUT /api/contacts/:id
 * Update an existing contact
 */
export const updateContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;

    const existing = await prisma.contact.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Contact not found.',
      });
      return;
    }

    const updated = await prisma.contact.update({
      where: { id: existing.id },
      data: {
        contactName: data.contactName?.trim(),
        companyName: data.companyName !== undefined ? data.companyName?.trim() || null : undefined,
        email: data.email !== undefined ? data.email?.trim() || null : undefined,
        phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
        taxNumber: data.taxNumber !== undefined ? data.taxNumber?.trim() || null : undefined,
        address: data.address !== undefined ? data.address?.trim() || null : undefined,
        notes: data.notes !== undefined ? data.notes?.trim() || null : undefined,
        receivables: data.receivables !== undefined ? data.receivables : undefined,
        payables: data.payables !== undefined ? data.payables : undefined,
        avatar: data.avatar !== undefined ? data.avatar : undefined,
      },
    });

    serverCache.invalidate(['contacts', 'sales', 'purchases']);

    res.json({
      success: true,
      message: 'Contact updated successfully.',
      data: { contact: updated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
export const deleteContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.contact.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Contact not found.',
      });
      return;
    }

    await prisma.contact.delete({
      where: { id: existing.id },
    });

    serverCache.invalidate(['contacts', 'sales', 'purchases']);

    res.json({
      success: true,
      message: 'Contact deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/contacts/:id/transactions
 * Retrieve all transactions (sales, purchases, payments, bills, expenses) associated with a contact
 */
export const getContactTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    const contact = await prisma.contact.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });

    if (!contact) {
      res.status(404).json({
        success: false,
        message: 'Contact not found.',
      });
      return;
    }

    const saleOrConditions: Prisma.SaleWhereInput[] = [
      { customerId: contact.id },
    ];
    if (contact.code) {
      saleOrConditions.push({ customerId: contact.code });
    }
    if (contact.contactName) {
      saleOrConditions.push({ customerName: { equals: contact.contactName, mode: 'insensitive' } });
    }
    if (contact.companyName) {
      saleOrConditions.push({ customerCompany: { equals: contact.companyName, mode: 'insensitive' } });
    }

    const purchaseOrConditions: Prisma.PurchaseWhereInput[] = [
      { supplierId: contact.id },
    ];
    if (contact.code) {
      purchaseOrConditions.push({ supplierId: contact.code });
    }
    if (contact.contactName) {
      purchaseOrConditions.push({ supplierName: { equals: contact.contactName, mode: 'insensitive' } });
    }
    if (contact.companyName) {
      purchaseOrConditions.push({ supplierCompany: { equals: contact.companyName, mode: 'insensitive' } });
    }

    const expenseOrConditions: Prisma.ExpenseWhereInput[] = [
      { contactId: contact.id },
    ];
    if (contact.contactName) {
      expenseOrConditions.push({ payee: { equals: contact.contactName, mode: 'insensitive' } });
    }

    // Parallelize queries across Sales, Purchases, and Expenses
    const [sales, purchases, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: { OR: saleOrConditions },
        include: {
          payments: { orderBy: { date: 'desc' } },
          items: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.purchase.findMany({
        where: { OR: purchaseOrConditions },
        include: {
          payments: { orderBy: { date: 'desc' } },
          bills: { orderBy: { date: 'desc' } },
          receipts: { orderBy: { date: 'desc' } },
          items: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.findMany({
        where: { OR: expenseOrConditions },
        orderBy: { date: 'desc' },
      }),
    ]);

    const transactions: any[] = [];

    // 1. Process Sales and their Payments
    sales.forEach((s) => {
      const isVoid = s.status === 'VOID';
      transactions.push({
        id: s.id,
        ref: s.ref,
        type: 'Sale',
        category: 'Sale',
        date: s.date ? new Date(s.date).toISOString().split('T')[0] : '',
        dueDate: s.dueDate ? new Date(s.dueDate).toISOString().split('T')[0] : null,
        amount: Number(s.total || 0),
        received: isVoid ? 0 : Number(s.received || 0),
        balance: isVoid ? 0 : Number(s.balance || 0),
        status: s.status,
        paymentMethod: '-',
        notes: s.notes || '',
        link: `/sales/${s.ref}`,
        itemsCount: s.items?.length || 0,
      });

      (s.payments || []).forEach((p) => {
        transactions.push({
          id: p.id,
          ref: p.ref,
          parentRef: s.ref,
          type: 'Payment Received',
          category: 'Payment',
          date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
          dueDate: null,
          amount: Number(p.amount || 0),
          received: p.voided || isVoid ? 0 : Number(p.amount || 0),
          balance: 0,
          status: p.voided || isVoid ? 'VOID' : 'PAID',
          paymentMethod: p.method || 'Bank Transfer',
          notes: p.notes || `Payment for Invoice ${s.ref}`,
          link: `/sales/${s.ref}`,
        });
      });
    });

    // 2. Process Purchases, Bills, and Payments
    purchases.forEach((p) => {
      const isVoid = p.status === 'VOID';
      transactions.push({
        id: p.id,
        ref: p.ref,
        type: 'Purchase',
        category: 'Purchase',
        date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
        dueDate: p.expectedDeliveryDate ? new Date(p.expectedDeliveryDate).toISOString().split('T')[0] : null,
        amount: Number(p.total || 0),
        received: isVoid ? 0 : Number(p.paid || 0),
        balance: isVoid ? 0 : Number(p.balance || 0),
        status: p.status,
        paymentMethod: '-',
        notes: p.notes || '',
        link: `/purchases/${p.ref}`,
        itemsCount: p.items?.length || 0,
      });

      (p.bills || []).forEach((b) => {
        const isBillVoid = isVoid || b.status === 'Voided';
        transactions.push({
          id: b.id,
          ref: b.ref,
          parentRef: p.ref,
          type: 'Purchase Bill',
          category: 'Bill',
          date: b.date ? new Date(b.date).toISOString().split('T')[0] : '',
          dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : null,
          amount: Number(b.amount || 0),
          received: isBillVoid ? 0 : Number(b.paid || 0),
          balance: isBillVoid ? 0 : Number(b.balance || 0),
          status: isBillVoid ? 'VOID' : b.status,
          paymentMethod: '-',
          notes: b.notes || `Bill for Purchase ${p.ref}`,
          link: `/purchases/bills/${b.id}`,
        });
      });

      (p.payments || []).forEach((pay) => {
        const isPayVoid = isVoid || pay.voided;
        transactions.push({
          id: pay.id,
          ref: pay.ref,
          parentRef: p.ref,
          type: 'Payment Sent',
          category: 'Payment',
          date: pay.date ? new Date(pay.date).toISOString().split('T')[0] : '',
          dueDate: null,
          amount: Number(pay.amount || 0),
          received: isPayVoid ? 0 : Number(pay.amount || 0),
          balance: 0,
          status: isPayVoid ? 'VOID' : 'PAID',
          paymentMethod: pay.method || 'Bank Transfer',
          notes: pay.notes || `Payment for Purchase ${p.ref}`,
          link: `/purchases/payments/${pay.id}`,
        });
      });
    });

    // 3. Process Expenses
    expenses.forEach((e) => {
      transactions.push({
        id: e.id,
        ref: e.ref,
        type: 'Expense',
        category: 'Expense',
        date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
        dueDate: null,
        amount: Number(e.amount || 0),
        received: e.voided ? 0 : (e.status === 'PAID' ? Number(e.amount || 0) : 0),
        balance: e.voided || e.status === 'PAID' ? 0 : Number(e.amount || 0),
        status: e.voided ? 'VOID' : e.status,
        paymentMethod: e.paymentMethod || '-',
        notes: e.description || e.notes || '',
        link: `/expenses/${e.id}`,
      });
    });

    // Sort chronologically (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Compute live metrics (excluding VOID transactions from active volumes and active balances)
    const activeSales = sales.filter((s) => s.status !== 'VOID');
    const activePurchases = purchases.filter((p) => p.status !== 'VOID');
    const activeExpenses = expenses.filter((e) => !e.voided);

    const totalSalesVolume = activeSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalPurchasesVolume = activePurchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
    const totalExpensesVolume = activeExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const calculatedReceivables = activeSales.reduce((sum, s) => sum + Number(s.balance || 0), 0);
    const calculatedPayables = activePurchases.reduce((sum, p) => sum + Number(p.balance || 0), 0);

    const totalToReceive = sales.length > 0 ? calculatedReceivables : Number(contact.receivables || 0);
    const totalToPay = purchases.length > 0 ? calculatedPayables : Number(contact.payables || 0);

    const totalReceived = activeSales.reduce((sum, s) => sum + Number(s.received || 0), 0);
    const totalPaid = activePurchases.reduce((sum, p) => sum + Number(p.paid || 0), 0);

    const summary = {
      totalSalesVolume: Number(totalSalesVolume.toFixed(2)),
      totalPurchasesVolume: Number(totalPurchasesVolume.toFixed(2)),
      totalExpensesVolume: Number(totalExpensesVolume.toFixed(2)),
      totalToReceive: Number(totalToReceive.toFixed(2)),
      totalToPay: Number(totalToPay.toFixed(2)),
      netBalance: Number((totalToReceive - totalToPay).toFixed(2)),
      totalReceived: Number(totalReceived.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      salesCount: sales.length,
      purchasesCount: purchases.length,
      expensesCount: expenses.length,
      paymentsCount: (sales.flatMap(s => s.payments || []).length) + (purchases.flatMap(p => p.payments || []).length),
      totalCount: transactions.length,
    };

    res.json({
      success: true,
      data: {
        contact,
        transactions,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

