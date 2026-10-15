import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { SaleStatus, PurchaseStatus, JournalStatus } from '@prisma/client';

export interface ChartAccount {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  description: string;
}

export const CHART_OF_ACCOUNTS: ChartAccount[] = [
  // ASSETS (1000s)
  { code: '1010', name: 'Cash on Hand', type: 'ASSET', description: 'Liquid cash in physical register or drawer' },
  { code: '1020', name: 'Bank Accounts', type: 'ASSET', description: 'Checking, savings, and merchant bank balances' },
  { code: '1200', name: 'Accounts Receivable', type: 'ASSET', description: 'Money owed by customers on credit sales' },
  { code: '1500', name: 'Merchandise Inventory', type: 'ASSET', description: 'Goods purchased and held for resale' },
  { code: '1700', name: 'Equipment & Fixtures', type: 'ASSET', description: 'Office and store equipment, computers, furniture' },

  // LIABILITIES (2000s)
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', description: 'Money owed to suppliers for bills and inventory' },
  { code: '2100', name: 'Sales Tax / GST Payable', type: 'LIABILITY', description: 'Taxes collected on sales to remit to authorities' },

  // EQUITY (3000s)
  { code: '3000', name: "Owner's Capital", type: 'EQUITY', description: "Owner's invested equity and capital funds" },
  { code: '3900', name: 'Retained Earnings', type: 'EQUITY', description: 'Accumulated profits retained in the business' },

  // REVENUE (4000s)
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', description: 'Gross revenue from product and merchandise sales' },
  { code: '4100', name: 'Service Income', type: 'REVENUE', description: 'Revenue earned from labor, services, and consulting' },
  { code: '4900', name: 'Other Income', type: 'REVENUE', description: 'Discounts earned, interest, and non-operating income' },

  // EXPENSES (5000s)
  { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', description: 'Direct costs of goods and inventory sold' },
  { code: '5100', name: 'Salaries & Wages', type: 'EXPENSE', description: 'Employee salaries, contractor pay, and payroll' },
  { code: '5200', name: 'Rent & Lease', type: 'EXPENSE', description: 'Facility rent, warehouse, and office leasing' },
  { code: '5300', name: 'Utilities & Telecom', type: 'EXPENSE', description: 'Electricity, water, internet, and phone bills' },
  { code: '5400', name: 'Office Supplies', type: 'EXPENSE', description: 'Stationery, paper, toner, and small office consumables' },
  { code: '5500', name: 'Marketing & Advertising', type: 'EXPENSE', description: 'Promotions, digital ads, flyers, and branding' },
  { code: '5600', name: 'Travel & Transportation', type: 'EXPENSE', description: 'Fuel, vehicle maintenance, shipping, and delivery' },
  { code: '5900', name: 'Miscellaneous Expenses', type: 'EXPENSE', description: 'Sundry and other operational costs' },
];

/**
 * Maps an expense category name to an account code
 */
function mapExpenseCategoryToCode(categoryName: string): { code: string; name: string } {
  const lower = (categoryName || '').toLowerCase();
  if (lower.includes('salar') || lower.includes('wage') || lower.includes('employee')) {
    return { code: '5100', name: 'Salaries & Wages' };
  }
  if (lower.includes('rent') || lower.includes('lease')) {
    return { code: '5200', name: 'Rent & Lease' };
  }
  if (lower.includes('util') || lower.includes('internet') || lower.includes('phone') || lower.includes('electric')) {
    return { code: '5300', name: 'Utilities & Telecom' };
  }
  if (lower.includes('suppl') || lower.includes('stationery') || lower.includes('paper')) {
    return { code: '5400', name: 'Office Supplies' };
  }
  if (lower.includes('market') || lower.includes('advert') || lower.includes('promo')) {
    return { code: '5500', name: 'Marketing & Advertising' };
  }
  if (lower.includes('travel') || lower.includes('fuel') || lower.includes('transport') || lower.includes('vehicle')) {
    return { code: '5600', name: 'Travel & Transportation' };
  }
  return { code: '5900', name: 'Miscellaneous Expenses' };
}

/**
 * GET /api/ledgers/accounts
 * Return all chart of accounts with dynamic live debit/credit aggregates and balances
 */
export const getLedgerAccounts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Fetch all account sources in parallel using Promise.all
    const [sales, purchases, expenses, journalLines] = await Promise.all([
      prisma.sale.findMany({
        where: { status: { notIn: [SaleStatus.VOID] } },
        select: {
          total: true,
          received: true,
          balance: true,
        },
      }),
      prisma.purchase.findMany({
        where: { status: { notIn: [PurchaseStatus.VOID] } },
        select: {
          total: true,
          paid: true,
          balance: true,
        },
      }),
      prisma.expense.findMany({
        where: { voided: false },
        select: {
          category: true,
          amount: true,
          paymentMethod: true,
        },
      }),
      prisma.journalLine.findMany({
        where: {
          journal: {
            status: JournalStatus.POSTED,
          },
        },
        select: {
          accountCode: true,
          debit: true,
          credit: true,
        },
      }),
    ]);

    // Tally debits & credits for each account code
    const accountTotals: Record<string, { debits: number; credits: number; count: number }> = {};
    CHART_OF_ACCOUNTS.forEach(a => {
      accountTotals[a.code] = { debits: 0, credits: 0, count: 0 };
    });

    // Apply Sales to Accounts
    sales.forEach(s => {
      const tot = Number(s.total || 0);
      const rec = Number(s.received || 0);
      const bal = Number(s.balance || 0);

      // Revenue (4000) Credited
      if (tot > 0) {
        accountTotals['4000'].credits += tot;
        accountTotals['4000'].count += 1;
      }
      // Bank / Cash (1020) Debited for received payments
      if (rec > 0) {
        accountTotals['1020'].debits += rec;
        accountTotals['1020'].count += 1;
      }
      // Accounts Receivable (1200) Debited for unpaid balances
      if (bal > 0) {
        accountTotals['1200'].debits += bal;
        accountTotals['1200'].count += 1;
      }
    });

    // Apply Purchases to Accounts
    purchases.forEach(p => {
      const tot = Number(p.total || 0);
      const paid = Number(p.paid || 0);
      const bal = Number(p.balance || 0);

      // COGS / Inventory (5000) Debited
      if (tot > 0) {
        accountTotals['5000'].debits += tot;
        accountTotals['5000'].count += 1;
      }
      // Bank / Cash (1020) Credited for paid amounts
      if (paid > 0) {
        accountTotals['1020'].credits += paid;
        accountTotals['1020'].count += 1;
      }
      // Accounts Payable (2000) Credited for unpaid bills
      if (bal > 0) {
        accountTotals['2000'].credits += bal;
        accountTotals['2000'].count += 1;
      }
    });

    // Apply Expenses to Accounts
    expenses.forEach(e => {
      const amt = Number(e.amount || 0);
      if (amt <= 0) return;

      const mapped = mapExpenseCategoryToCode(e.category);
      if (accountTotals[mapped.code]) {
        accountTotals[mapped.code].debits += amt;
        accountTotals[mapped.code].count += 1;
      }

      const isCash = (e.paymentMethod || '').toLowerCase().includes('cash');
      const creditCode = isCash ? '1010' : '1020';
      accountTotals[creditCode].credits += amt;
      accountTotals[creditCode].count += 1;
    });

    // Apply Manual Journal Entry Lines
    journalLines.forEach(line => {
      const code = line.accountCode;
      if (!accountTotals[code]) {
        accountTotals[code] = { debits: 0, credits: 0, count: 0 };
      }
      accountTotals[code].debits += Number(line.debit || 0);
      accountTotals[code].credits += Number(line.credit || 0);
      accountTotals[code].count += 1;
    });

    // Construct final enriched accounts with accounting balance rules
    // Assets & Expenses normal balance = Debit (Debit - Credit)
    // Liabilities, Equity, Revenue normal balance = Credit (Credit - Debit)
    const accounts = CHART_OF_ACCOUNTS.map(acct => {
      const tally = accountTotals[acct.code] || { debits: 0, credits: 0, count: 0 };
      let balance = 0;

      if (acct.type === 'ASSET' || acct.type === 'EXPENSE') {
        balance = tally.debits - tally.credits;
      } else {
        balance = tally.credits - tally.debits;
      }

      return {
        ...acct,
        totalDebits: Number(tally.debits.toFixed(2)),
        totalCredits: Number(tally.credits.toFixed(2)),
        balance: Number(balance.toFixed(2)),
        transactionCount: tally.count,
      };
    });

    res.json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ledgers/accounts/:code
 * Return full chronological transaction ledger for a specific account with running balance
 */
export const getLedgerAccountDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const code = req.params.code as string;
    const account = CHART_OF_ACCOUNTS.find(a => a.code === code) || {
      code,
      name: `Account ${code}`,
      type: 'ASSET' as const,
      description: 'General Ledger Account',
    };

    interface LedgerTxn {
      id: string;
      date: string;
      ref: string;
      type: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'JOURNAL';
      narration: string;
      partyName?: string;
      debit: number;
      credit: number;
    }

    const transactions: LedgerTxn[] = [];

    const shouldFetchSales = ['1200', '4000', '1010', '1020'].includes(code);
    const shouldFetchPurchases = ['2000', '5000', '1010', '1020'].includes(code);

    // Run all relevant queries concurrently in parallel
    const [sales, purchases, expenses, journalLines] = await Promise.all([
      shouldFetchSales
        ? prisma.sale.findMany({
            where: { status: { notIn: [SaleStatus.VOID] } },
            select: {
              id: true,
              ref: true,
              date: true,
              customerName: true,
              customerCompany: true,
              total: true,
              received: true,
              balance: true,
            },
            orderBy: { date: 'asc' },
          })
        : Promise.resolve([]),
      shouldFetchPurchases
        ? prisma.purchase.findMany({
            where: { status: { notIn: [PurchaseStatus.VOID] } },
            select: {
              id: true,
              ref: true,
              date: true,
              supplierName: true,
              supplierCompany: true,
              total: true,
              paid: true,
              balance: true,
            },
            orderBy: { date: 'asc' },
          })
        : Promise.resolve([]),
      prisma.expense.findMany({
        where: { voided: false },
        select: {
          id: true,
          ref: true,
          date: true,
          category: true,
          paymentMethod: true,
          amount: true,
          payee: true,
          description: true,
        },
        orderBy: { date: 'asc' },
      }),
      prisma.journalLine.findMany({
        where: {
          accountCode: code,
          journal: {
            status: JournalStatus.POSTED,
          },
        },
        select: {
          id: true,
          description: true,
          debit: true,
          credit: true,
          journal: {
            select: {
              date: true,
              ref: true,
              narration: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    // 1. Process Sales entries
    sales.forEach(s => {
      const dStr = s.date ? new Date(s.date).toISOString().split('T')[0] : '';
      const party = s.customerName || s.customerCompany || 'Customer';

      if (code === '4000') {
        transactions.push({
          id: `sale-rev-${s.id}`,
          date: dStr,
          ref: s.ref,
          type: 'SALE',
          narration: `Sales Invoice - ${party}`,
          partyName: party,
          debit: 0,
          credit: Number(s.total || 0),
        });
      } else if (code === '1200') {
        if (Number(s.balance || 0) > 0) {
          transactions.push({
            id: `sale-ar-${s.id}`,
            date: dStr,
            ref: s.ref,
            type: 'SALE',
            narration: `Credit Sale - ${party}`,
            partyName: party,
            debit: Number(s.balance || 0),
            credit: 0,
          });
        }
      } else if (code === '1020' && Number(s.received || 0) > 0) {
        transactions.push({
          id: `sale-pay-${s.id}`,
          date: dStr,
          ref: s.ref,
          type: 'SALE',
          narration: `Customer Payment received from ${party}`,
          partyName: party,
          debit: Number(s.received || 0),
          credit: 0,
        });
      }
    });

    // 2. Process Purchases entries
    purchases.forEach(p => {
      const dStr = p.date ? new Date(p.date).toISOString().split('T')[0] : '';
      const party = p.supplierName || p.supplierCompany || 'Supplier';

      if (code === '5000') {
        transactions.push({
          id: `po-cogs-${p.id}`,
          date: dStr,
          ref: p.ref,
          type: 'PURCHASE',
          narration: `Purchase Order - ${party}`,
          partyName: party,
          debit: Number(p.total || 0),
          credit: 0,
        });
      } else if (code === '2000') {
        if (Number(p.balance || 0) > 0) {
          transactions.push({
            id: `po-ap-${p.id}`,
            date: dStr,
            ref: p.ref,
            type: 'PURCHASE',
            narration: `Supplier Payable to ${party}`,
            partyName: party,
            debit: 0,
            credit: Number(p.balance || 0),
          });
        }
      } else if (code === '1020' && Number(p.paid || 0) > 0) {
        transactions.push({
          id: `po-disb-${p.id}`,
          date: dStr,
          ref: p.ref,
          type: 'PURCHASE',
          narration: `Payment to Supplier ${party}`,
          partyName: party,
          debit: 0,
          credit: Number(p.paid || 0),
        });
      }
    });

    // 3. Process Expense entries
    expenses.forEach(e => {
      const dStr = e.date ? new Date(e.date).toISOString().split('T')[0] : '';
      const mapped = mapExpenseCategoryToCode(e.category);
      const isCash = (e.paymentMethod || '').toLowerCase().includes('cash');
      const creditCode = isCash ? '1010' : '1020';
      const amt = Number(e.amount || 0);

      if (code === mapped.code) {
        transactions.push({
          id: `exp-${e.id}`,
          date: dStr,
          ref: e.ref,
          type: 'EXPENSE',
          narration: `Expense: ${e.category} - ${e.description || e.payee || ''}`,
          partyName: e.payee || undefined,
          debit: amt,
          credit: 0,
        });
      } else if (code === creditCode) {
        transactions.push({
          id: `exp-disb-${e.id}`,
          date: dStr,
          ref: e.ref,
          type: 'EXPENSE',
          narration: `Payment for ${e.category}`,
          partyName: e.payee || undefined,
          debit: 0,
          credit: amt,
        });
      }
    });

    // 4. Process Journal lines
    journalLines.forEach(jl => {
      const dStr = jl.journal.date ? new Date(jl.journal.date).toISOString().split('T')[0] : '';
      transactions.push({
        id: `jl-${jl.id}`,
        date: dStr,
        ref: jl.journal.ref,
        type: 'JOURNAL',
        narration: jl.description || jl.journal.narration || 'Journal Entry',
        debit: Number(jl.debit || 0),
        credit: Number(jl.credit || 0),
      });
    });

    // Sort all transactions chronologically
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Compute running balance based on account type
    let runningBalance = 0;
    const enrichedTransactions = transactions.map(txn => {
      if (account.type === 'ASSET' || account.type === 'EXPENSE') {
        runningBalance += (txn.debit - txn.credit);
      } else {
        runningBalance += (txn.credit - txn.debit);
      }
      return {
        ...txn,
        runningBalance: Number(runningBalance.toFixed(2)),
      };
    });

    const totalDebits = transactions.reduce((acc, t) => acc + t.debit, 0);
    const totalCredits = transactions.reduce((acc, t) => acc + t.credit, 0);

    res.json({
      success: true,
      data: {
        account,
        summary: {
          totalDebits: Number(totalDebits.toFixed(2)),
          totalCredits: Number(totalCredits.toFixed(2)),
          finalBalance: Number(runningBalance.toFixed(2)),
          transactionCount: transactions.length,
        },
        transactions: enrichedTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
};
