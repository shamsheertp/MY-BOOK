import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { Prisma } from '@prisma/client';

export const createProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1, 'Product name is required'),
  category: z.string().optional().default('General'),
  costPricePerKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).default(0),
  sellingPricePerKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).default(0),
  stockKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).default(0),
  minStockKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).default(10),
  unit: z.string().optional().default('kg'),
  description: z.string().optional().nullable(),
});

export const updateProductSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  costPricePerKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  sellingPricePerKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  stockKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  minStockKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  unit: z.string().optional(),
  description: z.string().optional().nullable(),
});

export const adjustStockSchema = z.object({
  type: z.enum(['ADD', 'SUBTRACT', 'SET', 'add', 'subtract', 'set']),
  quantityKg: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]),
  notes: z.string().optional().nullable(),
});

/**
 * Generate next unique SKU like PRD-001, PRD-002
 */
async function generateNextSku(): Promise<string> {
  const products = await prisma.product.findMany({
    where: {
      sku: {
        startsWith: 'PRD-',
      },
    },
    select: { sku: true },
  });

  let maxNum = 0;
  for (const p of products) {
    if (p.sku) {
      const match = p.sku.match(/PRD-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return `PRD-${nextNum.toString().padStart(3, '0')}`;
}

/**
 * Helper to enrich a product model with calculated fields:
 * - status: 'In Stock' | 'Low Stock' | 'Out of Stock'
 * - stockValue: stockKg * costPricePerKg
 * - potentialRevenue: stockKg * sellingPricePerKg
 * - marginPerKg: sellingPricePerKg - costPricePerKg
 * - marginPercent: ((sellingPricePerKg - costPricePerKg) / costPricePerKg) * 100
 */
function enrichProduct(p: any) {
  const stockKg = Number(p.stockKg || 0);
  const minStockKg = Number(p.minStockKg || 10);
  const costPricePerKg = Number(p.costPricePerKg || 0);
  const sellingPricePerKg = Number(p.sellingPricePerKg || 0);

  let status = 'In Stock';
  if (stockKg <= 0) {
    status = 'Out of Stock';
  } else if (stockKg <= minStockKg) {
    status = 'Low Stock';
  }

  const marginPerKg = sellingPricePerKg - costPricePerKg;
  const marginPercent = costPricePerKg > 0 ? Math.round((marginPerKg / costPricePerKg) * 100) : 0;
  const stockValue = Number((stockKg * costPricePerKg).toFixed(2));
  const potentialRevenue = Number((stockKg * sellingPricePerKg).toFixed(2));

  return {
    ...p,
    costPricePerKg,
    sellingPricePerKg,
    stockKg,
    minStockKg,
    // Alias fields for backwards UI compatibility
    price: sellingPricePerKg,
    costPrice: costPricePerKg,
    stock: stockKg,
    status,
    marginPerKg: Number(marginPerKg.toFixed(2)),
    marginPercent,
    stockValue,
    potentialRevenue,
  };
}

/**
 * GET /api/products
 * Retrieve all products with search, category & stock filters, plus aggregates
 */
export async function getProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 50));
    const search = ((req.query.search as string) || '').trim();
    const category = ((req.query.category as string) || '').trim();
    const status = ((req.query.status as string) || '').trim().toLowerCase();
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'All' && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    // First fetch all matching basic criteria to filter by status and calculate summary
    const allProducts = await prisma.product.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const enrichedAll = allProducts.map(enrichProduct);

    // Apply status filter if provided
    let filtered = enrichedAll;
    if (status && status !== 'all') {
      if (status === 'in stock' || status === 'in_stock') {
        filtered = enrichedAll.filter(p => p.status === 'In Stock');
      } else if (status === 'low stock' || status === 'low_stock') {
        filtered = enrichedAll.filter(p => p.status === 'Low Stock');
      } else if (status === 'out of stock' || status === 'out_of_stock') {
        filtered = enrichedAll.filter(p => p.status === 'Out of Stock');
      }
    }

    const totalCount = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filtered.slice(startIndex, startIndex + limit);

    // Calculate system-wide summary metrics
    const totalProductsCount = enrichedAll.length;
    const totalStockKg = enrichedAll.reduce((acc, p) => acc + p.stockKg, 0);
    const totalStockValue = enrichedAll.reduce((acc, p) => acc + p.stockValue, 0);
    const totalPotentialRevenue = enrichedAll.reduce((acc, p) => acc + p.potentialRevenue, 0);
    const lowStockCount = enrichedAll.filter(p => p.status === 'Low Stock').length;
    const outOfStockCount = enrichedAll.filter(p => p.status === 'Out of Stock').length;
    const inStockCount = enrichedAll.filter(p => p.status === 'In Stock').length;

    // Distinct categories
    const categories = Array.from(new Set(enrichedAll.map(p => p.category))).filter(Boolean);

    res.json({
      success: true,
      data: paginatedProducts,
      categories,
      summary: {
        totalProducts: totalProductsCount,
        totalStockKg: Number(totalStockKg.toFixed(2)),
        totalStockValue: Number(totalStockValue.toFixed(2)),
        totalPotentialRevenue: Number(totalPotentialRevenue.toFixed(2)),
        lowStockCount,
        outOfStockCount,
        inStockCount,
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
 * GET /api/products/categories
 * List distinct categories
 */
export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const products = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categories = products.map(p => p.category).filter(Boolean);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/products/:id
 * Retrieve a single product by UUID or SKU
 */
export async function getProductById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id },
          { sku: id },
        ],
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    res.json({
      success: true,
      data: enrichProduct(product),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/products
 * Create a new product
 */
export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    let {
      sku,
      name,
      category,
      costPricePerKg,
      sellingPricePerKg,
      stockKg,
      minStockKg,
      unit,
      description,
    } = req.body;

    if (!sku || sku.trim() === '') {
      sku = await generateNextSku();
    } else {
      sku = sku.trim();
      const existing = await prisma.product.findUnique({
        where: { sku },
      });
      if (existing) {
        res.status(400).json({
          success: false,
          message: `Product with SKU "${sku}" already exists`,
        });
        return;
      }
    }

    const created = await prisma.product.create({
      data: {
        sku,
        name: name.trim(),
        category: category?.trim() || 'General',
        costPricePerKg: costPricePerKg ?? 0,
        sellingPricePerKg: sellingPricePerKg ?? 0,
        stockKg: stockKg ?? 0,
        minStockKg: minStockKg ?? 10,
        unit: unit?.trim() || 'kg',
        description: description?.trim() || null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: enrichProduct(created),
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: 'A product with this SKU already exists',
      });
      return;
    }
    next(error);
  }
}

/**
 * PUT /api/products/:id
 * Update an existing product
 */
export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    const {
      sku,
      name,
      category,
      costPricePerKg,
      sellingPricePerKg,
      stockKg,
      minStockKg,
      unit,
      description,
    } = req.body;

    if (sku && sku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku },
      });
      if (duplicateSku) {
        res.status(400).json({
          success: false,
          message: `SKU "${sku}" is already in use by another product`,
        });
        return;
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(sku !== undefined && { sku: sku.trim() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(costPricePerKg !== undefined && { costPricePerKg }),
        ...(sellingPricePerKg !== undefined && { sellingPricePerKg }),
        ...(stockKg !== undefined && { stockKg }),
        ...(minStockKg !== undefined && { minStockKg }),
        ...(unit !== undefined && { unit: unit.trim() }),
        ...(description !== undefined && { description }),
      },
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: enrichProduct(updated),
    });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: 'A product with this SKU already exists',
      });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/products/:id/adjust-stock
 * Adjust stock in kg (Add, Subtract, or Set)
 */
export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { type, quantityKg } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    const currentStock = Number(existing.stockKg);
    const qty = Number(quantityKg);
    let newStock = currentStock;

    const normalizedType = String(type).toUpperCase();
    if (normalizedType === 'ADD') {
      newStock = currentStock + qty;
    } else if (normalizedType === 'SUBTRACT') {
      newStock = Math.max(0, currentStock - qty);
    } else if (normalizedType === 'SET') {
      newStock = Math.max(0, qty);
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid adjustment type. Must be ADD, SUBTRACT, or SET.',
      });
      return;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stockKg: newStock,
      },
    });

    res.json({
      success: true,
      message: `Stock successfully adjusted to ${newStock} kg`,
      data: enrichProduct(updated),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/products/:id
 * Delete a product
 */
export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
}
