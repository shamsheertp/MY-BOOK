import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { SaleStatus, PurchaseStatus } from '@prisma/client';

/**
 * GET /api/reports/profit-and-loss
 * Standard Income Statement / P&L based on live sales, purchases, and expenses
 */
export const getProfitAndLoss = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { dateFrom, dateTo, year } = req.query;

    const saleWhere: any = { status: { notIn: [SaleStatus.VOID] } };
    const purchaseWhere: any = { status: { notIn: [PurchaseStatus.VOID] } };
    const expenseWhere: any = { voided: false };

    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom as string);
      if (dateTo) dateFilter.lte = new Date(dateTo as string);

      saleWhere.date = dateFilter;
      purchaseWhere.date = dateFilter;
      expenseWhere.date = dateFilter;
    } else if (year) {
      const y = parseInt(year as string, 10);
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59);

      saleWhere.date = { gte: start, lte: end };
      purchaseWhere.date = { gte: start, lte: end };
      expenseWhere.date = { gte: start, lte: end };
    }

    const [sales, purchases, expenses] = await Promise.all([
      prisma.sale.findMany({
        where: saleWhere,
        select: {
          subtotal: true,
          discount: true,
          tax: true,
          total: true,
        },
      }),
      prisma.purchase.findMany({
        where: purchaseWhere,
        select: {
          total: true,
        },
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        select: {
          category: true,
          amount: true,
        },
      }),
    ]);

    // 1. Revenue
    const grossSales = sales.reduce((sum, s) => sum + Number(s.subtotal || s.total || 0), 0);
    const discounts = sales.reduce((sum, s) => sum + Number(s.discount || 0), 0);
    const netSales = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);

    // 2. Cost of Goods Sold (Purchases)
    const cogs = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);

    // 3. Gross Profit
    const grossProfit = netSales - cogs;
    const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // 4. Operating Expenses Breakdown by Category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'General & Admin';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
    });

    const operatingExpenses = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
    })).sort((a, b) => b.amount - a.amount);

    const totalOperatingExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 5. Net Profit
    const netProfit = grossProfit - totalOperatingExpenses;
    const netMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

    res.json({
      success: true,
      data: {
        period: {
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          year: year || null,
        },
        revenue: {
          grossSales: Number(grossSales.toFixed(2)),
          discounts: Number(discounts.toFixed(2)),
          netSales: Number(netSales.toFixed(2)),
          invoicesCount: sales.length,
        },
        costOfGoodsSold: {
          total: Number(cogs.toFixed(2)),
          ordersCount: purchases.length,
        },
        grossProfit: {
          amount: Number(grossProfit.toFixed(2)),
          marginPercent: Number(grossMargin.toFixed(2)),
        },
        operatingExpenses: {
          total: Number(totalOperatingExpenses.toFixed(2)),
          expensesCount: expenses.length,
          breakdown: operatingExpenses,
        },
        netIncome: {
          amount: Number(netProfit.toFixed(2)),
          marginPercent: Number(netMargin.toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
