import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { Prisma } from '@prisma/client';

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

    res.json({
      success: true,
      message: 'Contact deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
