import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { Prisma, PurchaseStatus } from '@prisma/client';
import { serverCache } from '../utils/cache.js';

export const createPurchaseItemSchema = z.object({
  id: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  name: z.string().min(1, 'Item name or material description is required'),
  orderedKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  unitPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  qty: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  price: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  ordered: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
});

export const createPurchaseSchema = z.object({
  ref: z.string().optional(),
  date: z.string().optional(),
  expectedDeliveryDate: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  supplierName: z.string().optional().nullable(),
  supplierCompany: z.string().optional().nullable(),
  supplierEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  supplierPhone: z.string().optional().nullable(),
  supplierAddress: z.string().optional().nullable(),
  status: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    z.nativeEnum(PurchaseStatus)
  ).default(PurchaseStatus.ORDERED),
  discount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional().default(0),
  taxPercent: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional().default(0),
  notes: z.string().optional().nullable(),
  items: z.array(createPurchaseItemSchema).min(1, 'At least one item is required'),
}).refine((data) => data.supplierId || (data.supplierName && data.supplierName.trim().length > 0), {
  message: 'Either Supplier ID or Supplier Name must be provided',
  path: ['supplierId'],
});

export const createReceiptSchema = z.object({
  ref: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      id: z.union([z.string(), z.number()]).optional().nullable(),
      name: z.string().optional().nullable(),
      currentReceiveKg: z.union([z.number(), z.string().transform(Number)]).optional(),
      currentReceive: z.union([z.number(), z.string().transform(Number)]).optional(),
    })
  ).min(1, 'At least one item receiving quantity is required'),
});

export const createBillSchema = z.object({
  ref: z.string().optional(),
  date: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      id: z.union([z.string(), z.number()]).optional().nullable(),
      name: z.string().optional().nullable(),
      currentBillKg: z.union([z.number(), z.string().transform(Number)]).optional(),
      toBill: z.union([z.number(), z.string().transform(Number)]).optional(),
    })
  ).min(1, 'At least one item billing quantity is required'),
});

export const recordPurchasePaymentSchema = z.object({
  amount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]),
  date: z.string().optional(),
  method: z.string().optional().default('Bank Transfer'),
  ref: z.string().optional(),
  billId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
});

export const voidPurchaseSchema = z.object({
  reason: z.string().optional(),
});

/**
 * Generate next unique PO reference like PO-2026001
 */
async function generateNextPurchaseRef(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const lastPurchase = await prisma.purchase.findFirst({
    where: {
      ref: {
        startsWith: `PO-${currentYear}`,
      },
    },
    orderBy: { ref: 'desc' },
    select: { ref: true },
  });

  let nextNum = 11;
  if (lastPurchase?.ref) {
    const match = lastPurchase.ref.match(new RegExp(`PO-${currentYear}(\\d+)`));
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }
  }

  return `PO-${currentYear}${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Generate next GRN reference like GRN-001
 */
async function generateNextReceiptRef(): Promise<string> {
  const lastReceipt = await prisma.purchaseReceipt.findFirst({
    where: { ref: { startsWith: 'GRN-' } },
    orderBy: { ref: 'desc' },
    select: { ref: true },
  });

  let nextNum = 11;
  if (lastReceipt?.ref) {
    const match = lastReceipt.ref.match(/GRN-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
  }
  return `GRN-${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Generate next Purchase Bill reference like BILL-001
 */
async function generateNextBillRef(): Promise<string> {
  const lastBill = await prisma.purchaseBill.findFirst({
    where: { ref: { startsWith: 'BILL-' } },
    orderBy: { ref: 'desc' },
    select: { ref: true },
  });

  let nextNum = 11;
  if (lastBill?.ref) {
    const match = lastBill.ref.match(/BILL-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
  }
  return `BILL-${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Generate next payment reference like PAY-OUT-001
 */
async function generateNextPaymentRef(): Promise<string> {
  const lastPayment = await prisma.purchasePayment.findFirst({
    where: { ref: { startsWith: 'PAY-OUT-' } },
    orderBy: { ref: 'desc' },
    select: { ref: true },
  });

  let nextNum = 11;
  if (lastPayment?.ref) {
    const match = lastPayment.ref.match(/PAY-OUT-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
  }
  return `PAY-OUT-${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Enrich purchase for frontend compatibility
 */
export function enrichPurchase(purchase: any) {
  const subtotal = Number(purchase.subtotal || 0);
  const discount = Number(purchase.discount || 0);
  const tax = Number(purchase.tax || 0);
  const taxPercent = Number(purchase.taxPercent || 0);
  const total = Number(purchase.total || 0);
  const paid = Number(purchase.paid || 0);
  const balance = Number(purchase.balance || 0);

  const formattedItems = (purchase.items || []).map((item: any) => {
    const orderedKg = Number(item.orderedKg || 0);
    const receivedKg = Number(item.receivedKg || 0);
    const billedKg = Number(item.billedKg || 0);
    const unitPrice = Number(item.unitPrice || 0);
    const itemTotal = Number(item.total || 0);

    return {
      ...item,
      orderedKg,
      receivedKg,
      billedKg,
      unitPrice,
      total: itemTotal,
      // Backward compatibility aliases for UI
      ordered: orderedKg,
      received: receivedKg,
      billed: billedKg,
      qty: orderedKg,
      price: unitPrice,
    };
  });

  const formattedReceipts = (purchase.receipts || []).map((r: any) => ({
    ...r,
    itemsReceived: Number(r.itemsReceived || 0),
    date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
  }));

  const formattedBills = (purchase.bills || []).map((b: any) => ({
    ...b,
    amount: Number(b.amount || 0),
    paid: Number(b.paid || 0),
    balance: Number(b.balance || 0),
    date: b.date ? new Date(b.date).toISOString().split('T')[0] : '',
    dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : '',
  }));

  const formattedPayments = (purchase.payments || []).map((p: any) => ({
    ...p,
    amount: Number(p.amount || 0),
    date: p.date ? new Date(p.date).toISOString().split('T')[0] : '',
  }));

  return {
    ...purchase,
    date: purchase.date ? new Date(purchase.date).toISOString().split('T')[0] : '',
    expectedDeliveryDate: purchase.expectedDeliveryDate ? new Date(purchase.expectedDeliveryDate).toISOString().split('T')[0] : '',
    subtotal,
    discount,
    tax,
    taxPercent,
    total,
    paid,
    balance,
    // Alias for UI compatibility
    amount: total,
    items: formattedItems,
    receipts: formattedReceipts,
    bills: formattedBills,
    payments: formattedPayments,
  };
}

/**
 * GET /api/purchases
 * List purchases with filtering, search, pagination, and summary metrics
 */
export async function getPurchases(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const search = ((req.query.search as string) || '').trim();
    const statusParam = (req.query.status as string) || '';
    const supplierId = (req.query.supplierId as string) || '';

    const where: Prisma.PurchaseWhereInput = {};

    if (search) {
      where.OR = [
        { ref: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
        { supplierCompany: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (statusParam && statusParam !== 'ALL') {
      const normalizedStatus = statusParam.toUpperCase() as PurchaseStatus;
      if (Object.values(PurchaseStatus).includes(normalizedStatus)) {
        where.status = normalizedStatus;
      }
    }

    const [purchases, totalCount, allSummary] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          supplier: true,
          items: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchase.count({ where }),
      prisma.purchase.findMany({
        select: {
          status: true,
          total: true,
          paid: true,
          balance: true,
        },
      }),
    ]);

    const nonVoidPurchases = allSummary.filter((p) => p.status !== PurchaseStatus.VOID);
    const totalAmount = nonVoidPurchases.reduce((acc, p) => acc + Number(p.total), 0);
    const totalPaid = nonVoidPurchases.reduce((acc, p) => acc + Number(p.paid), 0);
    const totalOutstanding = nonVoidPurchases.reduce((acc, p) => acc + Number(p.balance), 0);

    const orderedCount = allSummary.filter((p) => p.status === PurchaseStatus.ORDERED).length;
    const partiallyReceivedCount = allSummary.filter((p) => p.status === PurchaseStatus.PARTIALLY_RECEIVED).length;
    const receivedCount = allSummary.filter((p) => p.status === PurchaseStatus.RECEIVED).length;
    const completedCount = allSummary.filter((p) => p.status === PurchaseStatus.COMPLETED).length;
    const draftCount = allSummary.filter((p) => p.status === PurchaseStatus.DRAFT).length;
    const voidCount = allSummary.filter((p) => p.status === PurchaseStatus.VOID).length;

    res.json({
      success: true,
      data: purchases.map(enrichPurchase),
      summary: {
        totalPurchasesCount: allSummary.length,
        totalAmount: Number(totalAmount.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        totalOutstanding: Number(totalOutstanding.toFixed(2)),
        orderedCount,
        partiallyReceivedCount,
        receivedCount,
        completedCount,
        draftCount,
        voidCount,
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
 * GET /api/purchases/:id
 * Retrieve a single purchase order by ID or ref
 */
export async function getPurchaseById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const purchase = await prisma.purchase.findFirst({
      where: {
        OR: [{ id }, { ref: id }],
      },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
        receipts: {
          orderBy: { date: 'desc' },
        },
        bills: {
          orderBy: { date: 'desc' },
        },
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    res.json({
      success: true,
      data: enrichPurchase(purchase),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/purchases
 * Create a new purchase order
 */
export async function createPurchase(req: Request, res: Response, next: NextFunction) {
  try {
    let {
      ref,
      date,
      expectedDeliveryDate,
      supplierId,
      supplierName,
      supplierCompany,
      supplierEmail,
      supplierPhone,
      supplierAddress,
      status,
      discount = 0,
      taxPercent = 0,
      notes,
      items,
    } = req.body;

    if (!ref || ref.trim() === '') {
      ref = await generateNextPurchaseRef();
    } else {
      ref = ref.trim();
    }

    // Parallelize purchase ref uniqueness check and supplier contact lookup
    const [existing, contact] = await Promise.all([
      prisma.purchase.findUnique({ where: { ref }, select: { id: true } }),
      supplierId
        ? prisma.contact.findFirst({
            where: {
              OR: [{ id: supplierId }, { code: supplierId }],
            },
          })
        : Promise.resolve(null),
    ]);

    if (existing) {
      res.status(400).json({
        success: false,
        message: `Purchase reference "${ref}" already exists`,
      });
      return;
    }

    if (contact) {
      supplierId = contact.id;
      supplierName = supplierName || contact.contactName;
      supplierCompany = supplierCompany || contact.companyName || '';
      supplierEmail = supplierEmail || contact.email || '';
      supplierPhone = supplierPhone || contact.phone || '';
      supplierAddress = supplierAddress || contact.address || '';
    } else if (supplierId) {
      supplierId = null;
    }

    let subtotal = 0;
    const lineItemsData = items.map((item: any) => {
      const qty = parseFloat(item.orderedKg ?? item.qty ?? item.ordered) || 1;
      const price = parseFloat(item.unitPrice ?? item.price) || 0;
      const lineTotal = Number((qty * price).toFixed(2));
      subtotal += lineTotal;
      return {
        productId: item.productId || null,
        name: item.name.trim(),
        orderedKg: qty,
        receivedKg: 0,
        billedKg: 0,
        unitPrice: price,
        total: lineTotal,
      };
    });

    const discNum = parseFloat(discount) || 0;
    const taxPctNum = parseFloat(taxPercent) || 0;
    const taxableAmount = Math.max(0, subtotal - discNum);
    const taxAmount = Number(((taxableAmount * taxPctNum) / 100).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

    const purchase = await prisma.purchase.create({
      data: {
        ref,
        date: date ? new Date(date) : new Date(),
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        supplierId: supplierId || null,
        supplierName: supplierName.trim(),
        supplierCompany: supplierCompany?.trim() || null,
        supplierEmail: supplierEmail?.trim() || null,
        supplierPhone: supplierPhone?.trim() || null,
        supplierAddress: supplierAddress?.trim() || null,
        status: status || PurchaseStatus.ORDERED,
        subtotal,
        discount: discNum,
        tax: taxAmount,
        taxPercent: taxPctNum,
        total: totalAmount,
        paid: 0,
        balance: totalAmount,
        notes: notes?.trim() || null,
        items: {
          create: lineItemsData,
        },
      },
      include: {
        supplier: true,
        items: true,
        receipts: true,
        bills: true,
        payments: true,
      },
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.status(201).json({
      success: true,
      message: `Purchase order ${purchase.ref} created successfully`,
      data: enrichPurchase(purchase),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/purchases/:id/receipts
 * Receive goods / Create Goods Received Note (GRN):
 * - Increases item receivedKg
 * - Restores/Increases product inventory stock in kg
 * - Updates purchase status
 */
export async function createReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    let { ref, date, notes, items } = req.body;

    const purchase = await prisma.purchase.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { items: true },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    if (purchase.status === PurchaseStatus.VOID || purchase.status === PurchaseStatus.CANCELLED) {
      res.status(400).json({ success: false, message: 'Cannot receive goods for a voided or cancelled order' });
      return;
    }

    if (!ref || ref.trim() === '') {
      ref = await generateNextReceiptRef();
    }

    let totalReceivedInThisGrn = 0;

    const receipt = await prisma.$transaction(async (tx) => {
      for (const itemInput of items) {
        const receiveQty = Number(itemInput.currentReceiveKg ?? itemInput.currentReceive ?? 0);
        if (receiveQty <= 0) continue;

        const idStr = String(itemInput.id || '');
        const existingItem = purchase.items.find(
          (i) => i.id === idStr || (itemInput.name && i.name.toLowerCase() === itemInput.name.toLowerCase())
        );

        if (existingItem) {
          totalReceivedInThisGrn += receiveQty;
          const newReceivedKg = Number(existingItem.receivedKg) + receiveQty;

          await tx.purchaseItem.update({
            where: { id: existingItem.id },
            data: { receivedKg: newReceivedKg },
          });

          // Increase stockKg in product inventory
          if (existingItem.productId) {
            await tx.product.update({
              where: { id: existingItem.productId },
              data: {
                stockKg: {
                  increment: receiveQty,
                },
              },
            }).catch(() => {});
          }
        }
      }

      if (totalReceivedInThisGrn <= 0) {
        throw new Error('Please enter a receiving quantity greater than 0');
      }

      const createdReceipt = await tx.purchaseReceipt.create({
        data: {
          purchaseId: purchase.id,
          ref,
          date: date ? new Date(date) : new Date(),
          itemsReceived: totalReceivedInThisGrn,
          status: 'Received',
          notes: notes?.trim() || null,
        },
      });

      // Recalculate status
      const updatedItems = await tx.purchaseItem.findMany({
        where: { purchaseId: purchase.id },
      });

      const allFullyReceived = updatedItems.every(
        (i) => Number(i.receivedKg) >= Number(i.orderedKg)
      );
      const someReceived = updatedItems.some((i) => Number(i.receivedKg) > 0);

      let newStatus = purchase.status;
      if (allFullyReceived) {
        newStatus = Number(purchase.balance) <= 0 ? PurchaseStatus.COMPLETED : PurchaseStatus.RECEIVED;
      } else if (someReceived) {
        newStatus = PurchaseStatus.PARTIALLY_RECEIVED;
      }

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: newStatus },
      });

      return createdReceipt;
    }, { maxWait: 15000, timeout: 30000 });

    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        receipts: { orderBy: { date: 'desc' } },
        bills: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.status(201).json({
      success: true,
      message: `Goods receipt note ${ref} recorded. Inventory stock increased by ${totalReceivedInThisGrn} kg.`,
      data: enrichPurchase(updatedPurchase),
      receipt,
    });
  } catch (error: any) {
    if (error.message === 'Please enter a receiving quantity greater than 0') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/purchases/:id/receipts/:receiptId/void
 * Void a Goods Received Note:
 * - Decrements receivedKg
 * - Deducts received stockKg from product inventory
 */
export async function voidReceipt(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const receiptId = req.params.receiptId as string;

    const purchase = await prisma.purchase.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { items: true, receipts: true },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    const receipt = purchase.receipts.find((r) => r.id === receiptId || r.ref === receiptId);
    if (!receipt) {
      res.status(404).json({ success: false, message: 'Receipt not found' });
      return;
    }

    if (receipt.status === 'Voided') {
      res.status(400).json({ success: false, message: 'Receipt is already voided' });
      return;
    }

    const voidedKg = Number(receipt.itemsReceived);

    await prisma.$transaction(async (tx) => {
      await tx.purchaseReceipt.update({
        where: { id: receipt.id },
        data: { status: 'Voided' },
      });

      // Deduct from items and product stock proportionately
      for (const item of purchase.items) {
        if (Number(item.receivedKg) > 0) {
          const deductKg = Math.min(Number(item.receivedKg), voidedKg);
          await tx.purchaseItem.update({
            where: { id: item.id },
            data: { receivedKg: Math.max(0, Number(item.receivedKg) - deductKg) },
          });

          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockKg: {
                  decrement: deductKg,
                },
              },
            }).catch(() => {});
          }
        }
      }
    }, { maxWait: 15000, timeout: 30000 });

    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        receipts: { orderBy: { date: 'desc' } },
        bills: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: `Receipt ${receipt.ref} voided. Stock adjusted.`,
      data: enrichPurchase(updatedPurchase),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/purchases/:id/bills
 * Create a Purchase Bill for received goods:
 * - Updates item billedKg
 * - Increments supplier payables
 */
export async function createBill(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    let { ref, date, dueDate, notes, items } = req.body;

    const purchase = await prisma.purchase.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { items: true },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    if (!ref || ref.trim() === '') {
      ref = await generateNextBillRef();
    }

    let totalBilledAmount = 0;

    const result = await prisma.$transaction(async (tx) => {
      for (const itemInput of items) {
        const billQty = Number(itemInput.currentBillKg ?? itemInput.toBill ?? 0);
        if (billQty <= 0) continue;

        const idStr = String(itemInput.id || '');
        const existingItem = purchase.items.find(
          (i) => i.id === idStr || (itemInput.name && i.name.toLowerCase() === itemInput.name.toLowerCase())
        );

        if (existingItem) {
          const itemTotal = Number((billQty * Number(existingItem.unitPrice)).toFixed(2));
          totalBilledAmount += itemTotal;

          await tx.purchaseItem.update({
            where: { id: existingItem.id },
            data: { billedKg: Number(existingItem.billedKg) + billQty },
          });
        }
      }

      if (totalBilledAmount <= 0) {
        throw new Error('Please enter a billing quantity greater than 0');
      }

      // Add tax if purchase had tax
      const taxRate = Number(purchase.taxPercent || 0) / 100;
      const finalBillAmount = Number((totalBilledAmount * (1 + taxRate)).toFixed(2));

      const bill = await tx.purchaseBill.create({
        data: {
          purchaseId: purchase.id,
          ref,
          date: date ? new Date(date) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          amount: finalBillAmount,
          paid: 0,
          balance: finalBillAmount,
          status: 'UNPAID',
          notes: notes?.trim() || null,
        },
      });

      // Increment supplier payables
      if (purchase.supplierId) {
        await tx.contact.update({
          where: { id: purchase.supplierId },
          data: {
            payables: {
              increment: finalBillAmount,
            },
          },
        }).catch(() => {});
      }

      return bill;
    }, { maxWait: 15000, timeout: 30000 });

    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        receipts: { orderBy: { date: 'desc' } },
        bills: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.status(201).json({
      success: true,
      message: `Purchase bill ${ref} created for ₹${result.amount}. Payables updated.`,
      data: enrichPurchase(updatedPurchase),
      bill: result,
    });
  } catch (error: any) {
    if (error.message === 'Please enter a billing quantity greater than 0') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/purchases/:id/bills/:billId/void
 * Void a Purchase Bill:
 * - Deducts amount from supplier payables
 */
export async function voidBill(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const billId = req.params.billId as string;

    const purchase = await prisma.purchase.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { bills: true },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    const bill = purchase.bills.find((b) => b.id === billId || b.ref === billId);
    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found' });
      return;
    }

    if (bill.status === 'Voided') {
      res.status(400).json({ success: false, message: 'Bill is already voided' });
      return;
    }

    const billAmount = Number(bill.balance);

    await prisma.$transaction(async (tx) => {
      await tx.purchaseBill.update({
        where: { id: bill.id },
        data: { status: 'Voided', balance: 0 },
      });

      if (purchase.supplierId && billAmount > 0) {
        await tx.contact.update({
          where: { id: purchase.supplierId },
          data: {
            payables: {
              decrement: billAmount,
            },
          },
        }).catch(() => {});
      }
    }, { maxWait: 15000, timeout: 30000 });

    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        receipts: { orderBy: { date: 'desc' } },
        bills: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: `Bill ${bill.ref} voided successfully`,
      data: enrichPurchase(updatedPurchase),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/purchases/:id/payments
 * Record a payment out to supplier:
 * - Updates purchase paid & balance
 * - Decrements supplier payables
 * - Updates linked bill if specified
 */
export async function recordPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    let { amount, date, method, ref, billId, notes, image } = req.body;

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
      return;
    }

    const purchase = await prisma.purchase.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { bills: true },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    if (!ref || ref.trim() === '') {
      ref = await generateNextPaymentRef();
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.purchasePayment.create({
        data: {
          purchaseId: purchase.id,
          billId: billId || null,
          ref,
          date: date ? new Date(date) : new Date(),
          amount: paymentAmount,
          method: method || 'Bank Transfer',
          notes: notes?.trim() || null,
          image: image || null,
          voided: false,
        },
      });

      const newPaid = Number(purchase.paid) + paymentAmount;
      const newBalance = Math.max(0, Number(purchase.total) - newPaid);

      // Decrement supplier payables
      if (purchase.supplierId) {
        await tx.contact.update({
          where: { id: purchase.supplierId },
          data: {
            payables: {
              decrement: paymentAmount,
            },
          },
        }).catch(() => {});
      }

      // If linked bill exists, update bill
      if (billId) {
        const targetBill = purchase.bills.find((b) => b.id === billId || b.ref === billId);
        if (targetBill) {
          const newBillPaid = Number(targetBill.paid) + paymentAmount;
          const newBillBalance = Math.max(0, Number(targetBill.amount) - newBillPaid);
          const newBillStatus = newBillBalance <= 0 ? 'PAID' : 'PARTIAL';

          await tx.purchaseBill.update({
            where: { id: targetBill.id },
            data: {
              paid: newBillPaid,
              balance: newBillBalance,
              status: newBillStatus,
            },
          });
        }
      }

      let newStatus = purchase.status;
      if (newBalance <= 0) {
        newStatus = PurchaseStatus.COMPLETED;
      }

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          paid: newPaid,
          balance: newBalance,
          status: newStatus,
        },
      });

      return payment;
    }, { maxWait: 15000, timeout: 30000 });

    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        receipts: { orderBy: { date: 'desc' } },
        bills: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: `Payment of ₹${paymentAmount.toFixed(2)} recorded successfully`,
      data: enrichPurchase(updatedPurchase),
      payment: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/purchases/:id/payments/:paymentId/void
 * Void a payment out
 */
export async function voidPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const paymentId = req.params.paymentId as string;

    const purchase = await prisma.purchase.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { payments: true },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    const payment = purchase.payments.find((p) => p.id === paymentId || p.ref === paymentId);
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    if (payment.voided) {
      res.status(400).json({ success: false, message: 'Payment is already voided' });
      return;
    }

    const voidedAmount = Number(payment.amount);

    await prisma.$transaction(async (tx) => {
      await tx.purchasePayment.update({
        where: { id: payment.id },
        data: { voided: true },
      });

      const newPaid = Math.max(0, Number(purchase.paid) - voidedAmount);
      const newBalance = Math.max(0, Number(purchase.total) - newPaid);

      // Restore supplier payables
      if (purchase.supplierId) {
        await tx.contact.update({
          where: { id: purchase.supplierId },
          data: {
            payables: {
              increment: voidedAmount,
            },
          },
        }).catch(() => {});
      }

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          paid: newPaid,
          balance: newBalance,
          status: newBalance <= 0 ? PurchaseStatus.COMPLETED : PurchaseStatus.ORDERED,
        },
      });
    }, { maxWait: 15000, timeout: 30000 });

    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        receipts: { orderBy: { date: 'desc' } },
        bills: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: 'Payment voided successfully',
      data: enrichPurchase(updatedPurchase),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/purchases/:id/void
 * Void entire purchase order:
 * - Reverts received inventory stock
 * - Reverts supplier payables
 * - Marks receipts, bills, and payments as voided
 * - Sets status to VOID and balance to 0
 */
export async function voidPurchase(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { reason = '' } = req.body || {};

    const purchase = await prisma.purchase.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: {
        items: true,
        receipts: true,
        bills: true,
        payments: true,
      },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    if (purchase.status === PurchaseStatus.VOID) {
      res.status(400).json({ success: false, message: 'Purchase is already voided' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Revert received inventory stock from product
      for (const item of purchase.items) {
        if (item.productId && Number(item.receivedKg) > 0) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockKg: {
                decrement: Number(item.receivedKg),
              },
            },
          }).catch(() => {});
        }
      }

      // 2. Revert supplier payables for any active bills
      const activeBillsBalance = purchase.bills
        .filter((b) => b.status !== 'Voided')
        .reduce((sum, b) => sum + Number(b.balance), 0);

      if (purchase.supplierId && activeBillsBalance > 0) {
        await tx.contact.update({
          where: { id: purchase.supplierId },
          data: {
            payables: {
              decrement: activeBillsBalance,
            },
          },
        }).catch(() => {});
      }

      // 3. Mark receipts & bills as voided
      if (purchase.receipts.length > 0) {
        await tx.purchaseReceipt.updateMany({
          where: { purchaseId: purchase.id },
          data: { status: 'Voided' },
        });
      }

      if (purchase.bills.length > 0) {
        await tx.purchaseBill.updateMany({
          where: { purchaseId: purchase.id },
          data: { status: 'Voided', balance: 0 },
        });
      }

      if (purchase.payments.length > 0) {
        await tx.purchasePayment.updateMany({
          where: { purchaseId: purchase.id },
          data: { voided: true },
        });
      }

      // 4. Update purchase status
      const dateStr = new Date().toISOString().split('T')[0];
      const voidNote = `[VOIDED on ${dateStr}${reason ? `: ${reason}` : ''}]`;
      const updatedNotes = purchase.notes ? `${purchase.notes}\n${voidNote}` : voidNote;

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          status: PurchaseStatus.VOID,
          balance: 0,
          notes: updatedNotes,
        },
      });
    }, { maxWait: 15000, timeout: 30000 });

    const updatedPurchase = await prisma.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: { include: { product: true } },
        receipts: { orderBy: { date: 'desc' } },
        bills: { orderBy: { date: 'desc' } },
        payments: { orderBy: { date: 'desc' } },
      },
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: `Purchase order ${purchase.ref} has been voided. Stock and payables adjusted.`,
      data: enrichPurchase(updatedPurchase),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/purchases/:id
 * Delete purchase order
 */
export async function deletePurchase(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const purchase = await prisma.purchase.findFirst({
      where: { OR: [{ id }, { ref: id }] },
      include: { bills: true },
    });

    if (!purchase) {
      res.status(404).json({ success: false, message: 'Purchase order not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Revert payables for active bills if deleting
      const activeBillsBalance = purchase.bills
        .filter((b) => b.status !== 'Voided')
        .reduce((sum, b) => sum + Number(b.balance), 0);

      if (purchase.supplierId && activeBillsBalance > 0) {
        await tx.contact.update({
          where: { id: purchase.supplierId },
          data: {
            payables: {
              decrement: activeBillsBalance,
            },
          },
        }).catch(() => {});
      }

      await tx.purchase.delete({ where: { id: purchase.id } });
    });

    serverCache.invalidate(['purchases', 'reports', 'ledgers', 'contacts']);

    res.json({
      success: true,
      message: `Purchase order ${purchase.ref} deleted successfully`,
      data: { id: purchase.id, ref: purchase.ref },
    });
  } catch (error) {
    next(error);
  }
}
