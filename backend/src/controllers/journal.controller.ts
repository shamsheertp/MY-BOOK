import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { Prisma, JournalStatus, Role } from '@prisma/client';
import { serverCache } from '../utils/cache.js';

const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

export const createJournalLineSchema = z.object({
  accountCode: z.string().min(1, 'Account code is required'),
  accountName: z.string().min(1, 'Account name is required'),
  description: z.string().optional().nullable(),
  debit: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).default(0),
  credit: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).default(0),
});

export const createJournalSchema = z.object({
  ref: z.string().optional(),
  date: z.string().or(z.date()).optional(),
  narration: z.string().optional().nullable(),
  status: z.nativeEnum(JournalStatus).optional().default(JournalStatus.POSTED),
  lines: z.array(createJournalLineSchema).min(2, 'Journal must contain at least two entry lines (double-entry accounting)'),
});

export const voidJournalSchema = z.object({
  pin: z.string().min(1, 'Admin PIN is required'),
  reason: z.string().optional(),
});

/**
 * Generate next unique Journal Reference (e.g. JRN-2026001)
 */
async function generateNextJournalRef(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const lastJournal = await prisma.journalEntry.findFirst({
    where: {
      ref: {
        startsWith: `JRN-${currentYear}`,
      },
    },
    orderBy: { ref: 'desc' },
    select: { ref: true },
  });

  let nextNum = 1;
  if (lastJournal?.ref) {
    const match = lastJournal.ref.match(new RegExp(`JRN-${currentYear}(\\d+)`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }
  }

  return `JRN-${currentYear}${String(nextNum).padStart(3, '0')}`;
}

function formatJournal(journal: any) {
  if (!journal) return null;
  return {
    ...journal,
    totalDebit: Number(journal.totalDebit || 0),
    totalCredit: Number(journal.totalCredit || 0),
    date: journal.date instanceof Date ? journal.date.toISOString().split('T')[0] : journal.date,
    lines: (journal.lines || []).map((l: any) => ({
      ...l,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
    })),
  };
}

/**
 * GET /api/journals
 * List all journal entries with filtering, pagination, and totals
 */
export const getJournals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, status, dateFrom, dateTo } = req.query;

    const where: Prisma.JournalEntryWhereInput = {};

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { ref: { contains: q, mode: 'insensitive' } },
        { narration: { contains: q, mode: 'insensitive' } },
        {
          lines: {
            some: {
              OR: [
                { accountName: { contains: q, mode: 'insensitive' } },
                { accountCode: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      const normalizedStatus = status.toUpperCase() as JournalStatus;
      if (Object.values(JournalStatus).includes(normalizedStatus)) {
        where.status = normalizedStatus;
      }
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    const [total, journals] = await Promise.all([
      prisma.journalEntry.count({ where }),
      prisma.journalEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          lines: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        journals: journals.map(formatJournal),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/journals/:id
 * Get single journal by ID or Ref
 */
export const getJournalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const journal = await prisma.journalEntry.findFirst({
      where: {
        OR: [{ id }, { ref: id }],
      },
      include: {
        lines: true,
      },
    });

    if (!journal) {
      res.status(404).json({
        success: false,
        message: `Journal entry '${id}' not found`,
      });
      return;
    }

    res.json({
      success: true,
      data: formatJournal(journal),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/journals
 * Create a new journal entry with rigorous double-entry accounting validation
 */
export const createJournal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body;
    const lines = body.lines;

    // Validate double-entry accounting equation: Sum of Debits MUST equal Sum of Credits
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const d = Number(line.debit || 0);
      const c = Number(line.credit || 0);

      if (d < 0 || c < 0) {
        res.status(400).json({
          success: false,
          message: 'Debit and credit values must be non-negative',
        });
        return;
      }

      if (d === 0 && c === 0) {
        res.status(400).json({
          success: false,
          message: `Line for '${line.accountName}' must have either a debit or a credit amount`,
        });
        return;
      }

      totalDebit += d;
      totalCredit += c;
    }

    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      res.status(400).json({
        success: false,
        message: `Double-entry accounting validation failed: Total Debits (₹${totalDebit.toFixed(2)}) must equal Total Credits (₹${totalCredit.toFixed(2)}). Difference: ₹${diff.toFixed(2)}`,
      });
      return;
    }

    if (totalDebit <= 0) {
      res.status(400).json({
        success: false,
        message: 'Journal entry total must be greater than 0',
      });
      return;
    }

    const ref = body.ref && body.ref.trim().length > 0 ? body.ref.trim() : await generateNextJournalRef();

    const existing = await prisma.journalEntry.findUnique({
      where: { ref },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Journal entry with reference '${ref}' already exists`,
      });
      return;
    }

    const journalDate = body.date ? new Date(body.date) : new Date();

    const newJournal = await prisma.journalEntry.create({
      data: {
        ref,
        date: journalDate,
        narration: body.narration || null,
        status: body.status || JournalStatus.POSTED,
        totalDebit: new Prisma.Decimal(totalDebit),
        totalCredit: new Prisma.Decimal(totalCredit),
        createdById: (req as any).user?.id || null,
        lines: {
          create: lines.map((l: any) => ({
            accountCode: l.accountCode,
            accountName: l.accountName,
            description: l.description || null,
            debit: new Prisma.Decimal(Number(l.debit || 0)),
            credit: new Prisma.Decimal(Number(l.credit || 0)),
          })),
        },
      },
      include: {
        lines: true,
      },
    });

    serverCache.invalidate(['journals', 'ledgers', 'reports']);

    res.status(201).json({
      success: true,
      message: 'Journal entry created and posted successfully',
      data: formatJournal(newJournal),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/journals/:id/void
 * Void a posted journal entry (Requires Admin PIN)
 */
export const voidJournal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { pin, reason } = req.body;

    if (pin !== ADMIN_PIN) {
      res.status(403).json({
        success: false,
        message: 'Incorrect Admin PIN. Security verification failed.',
      });
      return;
    }

    const journal = await prisma.journalEntry.findFirst({
      where: {
        OR: [{ id }, { ref: id }],
      },
    });

    if (!journal) {
      res.status(404).json({
        success: false,
        message: `Journal entry '${id}' not found`,
      });
      return;
    }

    if (journal.status === JournalStatus.VOID) {
      res.status(400).json({
        success: false,
        message: `Journal '${journal.ref}' is already voided.`,
      });
      return;
    }

    const updated = await prisma.journalEntry.update({
      where: { id: journal.id },
      data: {
        status: JournalStatus.VOID,
        narration: reason ? `${journal.narration || ''} [VOIDED: ${reason}]`.trim() : journal.narration,
      },
      include: {
        lines: true,
      },
    });

    serverCache.invalidate(['journals', 'ledgers', 'reports']);

    res.json({
      success: true,
      message: `Journal '${journal.ref}' has been voided successfully`,
      data: formatJournal(updated),
    });
  } catch (error) {
    next(error);
  }
};
