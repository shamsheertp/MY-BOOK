import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma, DB_TX_OPTIONS } from '../config/db.js';
import { Prisma, SaleStatus } from '@prisma/client';
import { serverCache } from '../utils/cache.js';

export const createSaleItemSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().min(1, 'Item name or description is required'),
  quantityKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).default(1),
  unitPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).default(0),
});

export const createSaleSchema = z.object({
  ref: z.string().optional(),
  date: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerCompany: z.string().optional().nullable(),
  customerEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  customerPhone: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  status: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.nativeEnum(SaleStatus)
  ).default(SaleStatus.UNPAID),
  discount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional().default(0),
  taxPercent: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional().default(0),
  notes: z.string().optional().nullable(),
  items: z.array(createSaleItemSchema).min(1, 'At least one item is required'),
});

export const recordPaymentSchema = z.object({
  amount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]),
  date: z.string().optional(),
  method: z.string().optional().default('Bank Transfer'),
  ref: z.string().optional(),
  notes: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

/**
 * Generate next unique reference like SALE-2026030
 */
async function generateNextSaleRef(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const lastSale = await prisma.sale.findFirst({
    where: {
      ref: {
        startsWith: `SALE-${currentYear}`,
      },
    },
    orderBy: { ref: 'desc' },
    select: { ref: true },
  });

  let nextNum = 21;
  if (lastSale?.ref) {
    const match = lastSale.ref.match(new RegExp(`SALE-${currentYear}(\\d+)`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }
  }

  return `SALE-${currentYear}${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Generate next payment receipt ref like PAY-050
 */
async function generateNextPaymentRef(): Promise<string> {
  const payments = await prisma.salePayment.findMany({
    where: {
      ref: {
        startsWith: 'PAY-',
      },
    },
    select: { ref: true },
  });

  let maxNum = 40;
  for (const p of payments) {
    if (p.ref) {
      const match = p.ref.match(/PAY-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return `PAY-${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Formats a Sale record with number fields and backward compatibility aliases
 */
function enrichSale(sale: any) {
  const subtotal = Number(sale.subtotal || 0);
  const discount = Number(sale.discount || 0);
  const tax = Number(sale.tax || 0);
  const taxPercent = Number(sale.taxPercent || 0);
  const total = Number(sale.total || 0);
  const received = Number(sale.received || 0);
  const balance = Number(sale.balance || 0);

  const formattedItems = (sale.items || []).map((item: any) => {
    const qty = Number(item.quantityKg || 0);
    const price = Number(item.unitPrice || 0);
    const itemTotal = Number(item.total || 0);
    return {
      ...item,
      quantityKg: qty,
      unitPrice: price,
      total: itemTotal,
      // Alias for UI backwards compatibility
      qty,
      price,
    };
  });

  const formattedPayments = (sale.payments || []).map((p: any) => ({
    ...p,
    amount: Number(p.amount || 0),
    date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
  }));

  return {
    ...sale,
    date: sale.date ? new Date(sale.date).toISOString().split('T')[0] : '',
    dueDate: sale.dueDate ? new Date(sale.dueDate).toISOString().split('T')[0] : '',
    subtotal,
    discount,
    tax,
    taxPercent,
    total,
    received,
    balance,
    items: formattedItems,
    // Alias products array for invoice views
    products: formattedItems,
    payments: formattedPayments,
  };
}

/**
 * GET /api/sales
 * List all sales invoices with search, status filters, and summary aggregates
 */
export async function getSales(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 50));
    const search = ((req.query.search as string) || '').trim();
    const status = ((req.query.status as string) || '').trim().toUpperCase();
    const customerId = (req.query.customerId as string) || '';

    const where: Prisma.SaleWhereInput = {};

    if (search) {
      where.OR = [
        { ref: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerCompany: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status && status !== 'ALL') {
      if (Object.values(SaleStatus).includes(status as SaleStatus)) {
        where.status = status as SaleStatus;
      }
    }

    const [sales, totalCount, allSalesSummary] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        select: {
          status: true,
          total: true,
          received: true,
          balance: true,
        },
      }),
    ]);

    // Calculate system-wide summary metrics
    const totalAmount = allSalesSummary.reduce((acc, s) => acc + Number(s.total), 0);
    const totalReceived = allSalesSummary.reduce((acc, s) => acc + Number(s.received), 0);
    const totalOutstanding = allSalesSummary.reduce((acc, s) => acc + Number(s.balance), 0);

    const paidCount = allSalesSummary.filter(s => s.status === SaleStatus.PAID).length;
    const unpaidCount = allSalesSummary.filter(s => s.status === SaleStatus.UNPAID).length;
    const partialCount = allSalesSummary.filter(s => s.status === SaleStatus.PARTIAL).length;
    const overdueCount = allSalesSummary.filter(s => s.status === SaleStatus.OVERDUE).length;
    const draftCount = allSalesSummary.filter(s => s.status === SaleStatus.DRAFT).length;

    res.json({
      success: true,
      data: sales.map(enrichSale),
      summary: {
        totalSalesCount: allSalesSummary.length,
        totalAmount: Number(totalAmount.toFixed(2)),
        totalReceived: Number(totalReceived.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        paidCount,
        unpaidCount,
        partialCount,
        overdueCount,
        draftCount,
      },
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/sales/:id
 * Retrieve a single sale invoice by UUID or ref
 */
export async function getSaleById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          { id },
          { ref: id },
        ],
      },
      include: {
        contact: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!sale) {
      res.status(404).json({
        success: false,
        message: 'Sale invoice not found',
      });
      return;
    }

    res.json({
      success: true,
      data: enrichSale(sale),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/sales
 * Create a new sales invoice with line items, inventory reduction, and receivables update
 */
export async function createSale(req: Request, res: Response, next: NextFunction) {
  try {
    let {
      ref,
      date,
      dueDate,
      customerId,
      customerName,
      customerCompany,
      customerEmail,
      customerPhone,
      customerAddress,
      status,
      discount = 0,
      taxPercent = 0,
      notes,
      items,
    } = req.body;

    if (!ref || ref.trim() === '') {
      ref = await generateNextSaleRef();
    } else {
      ref = ref.trim();
    }

    // Parallelize reference existence check and customer enrichment lookup
    const [existing, contact] = await Promise.all([
      prisma.sale.findUnique({ where: { ref }, select: { id: true } }),
      customerId ? prisma.contact.findUnique({ where: { id: customerId } }) : Promise.resolve(null),
    ]);

    if (existing) {
      res.status(400).json({
        success: false,
        message: `Invoice reference "${ref}" already exists`,
      });
      return;
    }

    if (contact) {
      customerName = customerName || contact.contactName;
      customerCompany = customerCompany || contact.companyName || '';
      customerEmail = customerEmail || contact.email || '';
      customerPhone = customerPhone || contact.phone || '';
      customerAddress = customerAddress || contact.address || '';
    }

    // Calculate line items totals
    let subtotal = 0;
    const lineItemsData = items.map((item: any) => {
      const qty = parseFloat(item.quantityKg ?? item.qty) || 1;
      const price = parseFloat(item.unitPrice ?? item.price) || 0;
      const lineTotal = Number((qty * price).toFixed(2));
      subtotal += lineTotal;
      return {
        productId: item.productId || null,
        name: item.name.trim(),
        quantityKg: qty,
        unitPrice: price,
        total: lineTotal,
      };
    });

    const discNum = parseFloat(discount) || 0;
    const taxPctNum = parseFloat(taxPercent) || 0;
    const taxableAmount = Math.max(0, subtotal - discNum);
    const taxAmount = Number(((taxableAmount * taxPctNum) / 100).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));
    const balanceAmount = totalAmount;

    // Use transaction to create sale, reduce product stock, and update customer receivables concurrently
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          ref,
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          customerId: customerId || null,
          customerName: customerName.trim(),
          customerCompany: customerCompany?.trim() || null,
          customerEmail: customerEmail?.trim() || null,
          customerPhone: customerPhone?.trim() || null,
          customerAddress: customerAddress?.trim() || null,
          status: status || SaleStatus.UNPAID,
          subtotal,
          discount: discNum,
          tax: taxAmount,
          taxPercent: taxPctNum,
          total: totalAmount,
          received: 0,
          balance: balanceAmount,
          notes: notes?.trim() || null,
          items: {
            create: lineItemsData,
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // Deduct inventory stock & update customer receivables in parallel
      if (status !== SaleStatus.DRAFT) {
        const productUpdates = lineItemsData
          .filter((item: any) => Boolean(item.productId))
          .map((item: any) =>
            tx.product.update({
              where: { id: item.productId },
              data: {
                stockKg: {
                  decrement: item.quantityKg,
                },
              },
            }).catch(() => {})
          );

        const contactUpdate = customerId
          ? tx.contact.update({
              where: { id: customerId },
              data: {
                receivables: {
                  increment: totalAmount,
                },
              },
            }).catch(() => {})
          : Promise.resolve();

        await Promise.all([...productUpdates, contactUpdate]);
      }

      return sale;
    }, DB_TX_OPTIONS);

    serverCache.invalidate(['sales', 'reports', 'ledgers', 'contacts']);

    res.status(201).json({
      success: true,
      message: 'Sales invoice created successfully',
      data: enrichSale(result),
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: 'A sale invoice with this reference already exists',
      });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/sales/:id/payments
 * Record a payment against an invoice, update balance, status, and receivables
 */
export async function recordPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { amount, date, method, notes, image } = req.body;
    let { ref } = req.body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0',
      });
      return;
    }

    const sale = await prisma.sale.findFirst({
      where: {
        OR: [{ id }, { ref: id }],
      },
      include: {
        payments: true,
      },
    });

    if (!sale) {
      res.status(404).json({
        success: false,
        message: 'Sale invoice not found',
      });
      return;
    }

    if (!ref || ref.trim() === '') {
      ref = await generateNextPaymentRef();
    }

    // Pre-calculate updated sale financials
    const newReceived = Number(sale.received) + paymentAmount;
    const newBalance = Math.max(0, Number(sale.total) - newReceived);

    let newStatus = sale.status;
    if (newBalance <= 0) {
      newStatus = SaleStatus.PAID;
    } else if (newReceived > 0) {
      newStatus = SaleStatus.PARTIAL;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Execute payment creation, invoice update, and customer receivable decrement concurrently
      const [payment, updatedSale] = await Promise.all([
        tx.salePayment.create({
          data: {
            saleId: sale.id,
            ref: ref.trim(),
            date: date ? new Date(date) : new Date(),
            amount: paymentAmount,
            method: method?.trim() || 'Bank Transfer',
            notes: notes?.trim() || null,
            image: image?.trim() || null,
          },
        }),
        tx.sale.update({
          where: { id: sale.id },
          data: {
            received: newReceived,
            balance: newBalance,
            status: newStatus,
          },
          include: {
            items: true,
            payments: {
              orderBy: { date: 'desc' },
            },
          },
        }),
        ...(sale.customerId
          ? [
              tx.contact
                .update({
                  where: { id: sale.customerId },
                  data: {
                    receivables: {
                      decrement: paymentAmount,
                    },
                  },
                })
                .catch(() => null),
            ]
          : []),
      ]);

      return { payment, sale: updatedSale };
    }, DB_TX_OPTIONS);

    serverCache.invalidate(['sales', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: `Payment of ₹${paymentAmount.toFixed(2)} recorded successfully`,
      data: enrichSale(result.sale),
      payment: result.payment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/sales/:id/payments/:paymentId/void
 * Void a previously recorded payment
 */
export async function voidPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const paymentId = req.params.paymentId as string;

    const sale = await prisma.sale.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { payments: true },
    });

    if (!sale) {
      res.status(404).json({ success: false, message: 'Sale invoice not found' });
      return;
    }

    const payment = sale.payments.find(p => p.id === paymentId || p.ref === paymentId);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    if (payment.voided) {
      res.status(400).json({ success: false, message: 'Payment is already voided' });
      return;
    }

    const voidedAmount = Number(payment.amount);
    const newReceived = Math.max(0, Number(sale.received) - voidedAmount);
    const newBalance = Math.max(0, Number(sale.total) - newReceived);

    let newStatus = sale.status;
    if (newBalance <= 0) {
      newStatus = SaleStatus.PAID;
    } else if (newReceived > 0) {
      newStatus = SaleStatus.PARTIAL;
    } else {
      newStatus = SaleStatus.UNPAID;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Execute payment voiding, sale balance update, and customer receivable restoration concurrently
      const [, updatedSale] = await Promise.all([
        tx.salePayment.update({
          where: { id: payment.id },
          data: { voided: true },
        }),
        tx.sale.update({
          where: { id: sale.id },
          data: {
            received: newReceived,
            balance: newBalance,
            status: newStatus,
          },
          include: {
            items: true,
            payments: { orderBy: { date: 'desc' } },
          },
        }),
        ...(sale.customerId
          ? [
              tx.contact
                .update({
                  where: { id: sale.customerId },
                  data: {
                    receivables: {
                      increment: voidedAmount,
                    },
                  },
                })
                .catch(() => null),
            ]
          : []),
      ]);

      return updatedSale;
    }, DB_TX_OPTIONS);

    serverCache.invalidate(['sales', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: 'Payment voided successfully',
      data: enrichSale(result),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/sales/:id
 * Delete a sales invoice and its line items / payments
 */
export async function deleteSale(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const sale = await prisma.sale.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { items: true },
    });

    if (!sale) {
      res.status(404).json({ success: false, message: 'Sale invoice not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // If customer has outstanding balance, deduct from receivables
      if (sale.customerId && Number(sale.balance) > 0) {
        await tx.contact.update({
          where: { id: sale.customerId },
          data: {
            receivables: {
              decrement: Number(sale.balance),
            },
          },
        }).catch(() => {});
      }

      await tx.sale.delete({
        where: { id: sale.id },
      });
    }, DB_TX_OPTIONS);

    serverCache.invalidate(['sales', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: 'Sale invoice deleted successfully',
      data: { id: sale.id, ref: sale.ref },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/sales/:id/void
 * Void an entire sales invoice:
 * - Reverts product inventory stock (restores stockKg for all line items)
 * - Reverts customer receivables by the unpaid invoice balance
 * - Marks all payments as voided
 * - Sets invoice status to VOID and balance to 0
 */
export async function voidSale(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { reason = '' } = req.body || {};

    const sale = await prisma.sale.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!sale) {
      res.status(404).json({ success: false, message: 'Sale invoice not found' });
      return;
    }

    if (sale.status === SaleStatus.VOID) {
      res.status(400).json({ success: false, message: 'Invoice is already voided' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Restore product inventory stock (if not draft) concurrently
      if (sale.status !== SaleStatus.DRAFT) {
        const itemRestores = sale.items
          .filter(item => item.productId && Number(item.quantityKg) > 0)
          .map(item =>
            tx.product.update({
              where: { id: item.productId! },
              data: {
                stockKg: {
                  increment: Number(item.quantityKg),
                },
              },
            }).catch(() => {})
          );

        const unpaidBalance = Number(sale.balance);
        const contactAdjustment = (sale.customerId && unpaidBalance > 0)
          ? tx.contact.update({
              where: { id: sale.customerId },
              data: {
                receivables: {
                  decrement: unpaidBalance,
                },
              },
            }).catch(() => {})
          : Promise.resolve();

        await Promise.all([...itemRestores, contactAdjustment]);
      }

      // 2. Mark all payments recorded for this invoice as voided
      if (sale.payments.length > 0) {
        await tx.salePayment.updateMany({
          where: { saleId: sale.id },
          data: { voided: true },
        });
      }

      // 3. Update the invoice status to VOID
      const dateStr = new Date().toISOString().split('T')[0];
      const voidNote = `[VOIDED on ${dateStr}${reason ? `: ${reason}` : ''}]`;
      const updatedNotes = sale.notes ? `${sale.notes}\n${voidNote}` : voidNote;

      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: SaleStatus.VOID,
          balance: 0,
          notes: updatedNotes,
        },
        include: {
          items: true,
          payments: { orderBy: { date: 'desc' } },
        },
      });

      return updatedSale;
    }, DB_TX_OPTIONS);

    serverCache.invalidate(['sales', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: `Invoice ${sale.ref} has been voided successfully. Stock restored.`,
      data: enrichSale(result),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/sales/:id/payments/:paymentId/proof
 * Attach or update payment proof document URL (stored on Cloudflare R2)
 */
export async function updatePaymentProof(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const paymentId = req.params.paymentId as string;
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      res.status(400).json({ success: false, message: 'Proof document URL is required' });
      return;
    }

    const sale = await prisma.sale.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { payments: true },
    });

    if (!sale) {
      res.status(404).json({ success: false, message: 'Sale invoice not found' });
      return;
    }

    const payment = sale.payments.find(p => p.id === paymentId || p.ref === paymentId);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    const updatedPayment = await prisma.salePayment.update({
      where: { id: payment.id },
      data: { image: image.trim() },
    });

    serverCache.invalidate(['sales']);

    res.json({
      success: true,
      message: 'Payment proof attached successfully',
      data: updatedPayment,
    });
  } catch (error) {
    next(error);
  }
}


