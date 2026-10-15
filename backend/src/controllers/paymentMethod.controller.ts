import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional().nullable(),
  type: z.enum(['CASH', 'BANK', 'CARD', 'UPI', 'CHEQUE', 'OTHER']).default('BANK'),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  type: z.enum(['CASH', 'BANK', 'CARD', 'UPI', 'CHEQUE', 'OTHER']).optional(),
  description: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const DEFAULT_METHODS = [
  { name: 'Cash', code: 'CASH', type: 'CASH', isDefault: true, description: 'Physical cash transaction' },
  { name: 'Bank Transfer', code: 'BANK', type: 'BANK', isDefault: false, description: 'Bank transfer or wire' },
  { name: 'Credit Card', code: 'CARD', type: 'CARD', isDefault: false, description: 'Credit or debit card payment' },
  { name: 'UPI', code: 'UPI', type: 'UPI', isDefault: false, description: 'Instant UPI / QR payment' },
  { name: 'Cheque', code: 'CHEQUE', type: 'CHEQUE', isDefault: false, description: 'Bank cheque payment' },
];

/**
 * Get all payment methods (seeds defaults if table is empty)
 */
export const getPaymentMethods = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let methods = await prisma.paymentMethod.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (methods.length === 0) {
      for (const m of DEFAULT_METHODS) {
        await prisma.paymentMethod.create({
          data: m,
        });
      }

      methods = await prisma.paymentMethod.findMany({
        orderBy: [
          { isDefault: 'desc' },
          { name: 'asc' },
        ],
        include: {
          _count: {
            select: { expenses: true },
          },
        },
      });
    }

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new payment method
 */
export const createPaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, code, type, description, isDefault, isActive } = req.body;

    // Check duplicate name
    const existingName = await prisma.paymentMethod.findUnique({
      where: { name },
    });
    if (existingName) {
      res.status(409).json({
        success: false,
        message: `Payment method '${name}' already exists`,
      });
      return;
    }

    // Check duplicate code if provided
    if (code) {
      const existingCode = await prisma.paymentMethod.findUnique({
        where: { code },
      });
      if (existingCode) {
        res.status(409).json({
          success: false,
          message: `Payment method code '${code}' is already in use`,
        });
        return;
      }
    }

    // If setting as default, clear default on other methods
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const newMethod = await prisma.paymentMethod.create({
      data: {
        name,
        code: code || null,
        type: type || 'BANK',
        description: description || null,
        isDefault: Boolean(isDefault),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment method created successfully',
      data: newMethod,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing payment method
 */
export const updatePaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, code, type, description, isDefault, isActive } = req.body;

    const existing = await prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Payment method not found',
      });
      return;
    }

    if (name && name !== existing.name) {
      const duplicateName = await prisma.paymentMethod.findUnique({
        where: { name },
      });
      if (duplicateName) {
        res.status(409).json({
          success: false,
          message: `Payment method '${name}' already exists`,
        });
        return;
      }
    }

    if (code && code !== existing.code) {
      const duplicateCode = await prisma.paymentMethod.findUnique({
        where: { code },
      });
      if (duplicateCode) {
        res.status(409).json({
          success: false,
          message: `Payment method code '${code}' is already in use`,
        });
        return;
      }
    }

    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(type !== undefined && { type }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a payment method
 */
export const deletePaymentMethod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Payment method not found',
      });
      return;
    }

    // Safely unlink any expenses pointing to this payment method ID so historical records remain intact
    await prisma.expense.updateMany({
      where: { paymentMethodId: id },
      data: { paymentMethodId: null },
    });

    await prisma.paymentMethod.delete({
      where: { id },
    });

    // If deleted method was default, make another active method default if available
    if (existing.isDefault) {
      const fallback = await prisma.paymentMethod.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (fallback) {
        await prisma.paymentMethod.update({
          where: { id: fallback.id },
          data: { isDefault: true },
        });
      }
    }

    res.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
