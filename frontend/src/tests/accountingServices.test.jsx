import { describe, it, expect, vi, beforeEach } from 'vitest';
import { journalsService, ledgersService, reportsService, uploadService } from '../services/api';
import api from '../services/api';

describe('Accounting Services (Journals, Ledgers, Reports)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('journalsService', () => {
    it('has all required methods', () => {
      expect(typeof journalsService.list).toBe('function');
      expect(typeof journalsService.getById).toBe('function');
      expect(typeof journalsService.create).toBe('function');
      expect(typeof journalsService.void).toBe('function');
    });

    it('calls GET /journals with formatted query string', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
        data: { success: true, data: [] }
      });

      const res = await journalsService.list({ search: 'JV-2026', status: 'POSTED' });
      expect(getSpy).toHaveBeenCalledWith('/journals?page=1&limit=50&search=JV-2026&status=POSTED');
      expect(res.success).toBe(true);
    });

    it('calls POST /journals with valid double-entry voucher', async () => {
      const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
        data: { success: true, data: { id: 'j-1', ref: 'JV-2026-0001' } }
      });

      const entry = {
        date: '2026-10-15',
        type: 'GENERAL',
        narration: 'Office Rent Accrual',
        lines: [
          { accountCode: '5010', accountName: 'Rent Expense', debit: 5000, credit: 0 },
          { accountCode: '1020', accountName: 'Bank Account', debit: 0, credit: 5000 }
        ]
      };

      const res = await journalsService.create(entry);
      expect(postSpy).toHaveBeenCalledWith('/journals', entry);
      expect(res.success).toBe(true);
    });

    it('calls POST /journals/:id/void requiring admin PIN for security', async () => {
      const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
        data: { success: true, message: 'Journal voided successfully' }
      });

      const res = await journalsService.void('j-1', {
        adminPin: '1234',
        reason: 'Entered in error'
      });
      expect(postSpy).toHaveBeenCalledWith('/journals/j-1/void', {
        adminPin: '1234',
        reason: 'Entered in error'
      });
      expect(res.success).toBe(true);
    });
  });

  describe('ledgersService', () => {
    it('has all required methods', () => {
      expect(typeof ledgersService.getAccounts).toBe('function');
      expect(typeof ledgersService.getAccountDetails).toBe('function');
    });

    it('calls GET /ledgers/accounts', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
        data: { success: true, data: [{ code: '1010', name: 'Cash on Hand' }] }
      });

      const res = await ledgersService.getAccounts();
      expect(getSpy).toHaveBeenCalledWith('/ledgers/accounts');
      expect(res.data.length).toBe(1);
    });

    it('calls GET /ledgers/accounts/:code for statement with running balance', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
        data: {
          success: true,
          data: {
            account: { code: '1020', name: 'Bank Account' },
            summary: { totalDebits: 10000, totalCredits: 2000, finalBalance: 8000 },
            transactions: []
          }
        }
      });

      const res = await ledgersService.getAccountDetails('1020');
      expect(getSpy).toHaveBeenCalledWith('/ledgers/accounts/1020');
      expect(res.data.summary.finalBalance).toBe(8000);
    });
  });

  describe('reportsService', () => {
    it('has getProfitAndLoss function', () => {
      expect(typeof reportsService.getProfitAndLoss).toBe('function');
    });

    it('calls GET /reports/profit-and-loss with date filters', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
        data: {
          success: true,
          data: {
            revenue: { netSales: 50000 },
            costOfGoodsSold: { total: 20000 },
            grossProfit: { amount: 30000, marginPercent: 60 },
            operatingExpenses: { total: 10000, breakdown: [] },
            netIncome: { amount: 20000, marginPercent: 40 }
          }
        }
      });

      const res = await reportsService.getProfitAndLoss({ year: 2026 });
      expect(getSpy).toHaveBeenCalledWith('/reports/profit-and-loss?year=2026');
      expect(res.data.netIncome.amount).toBe(20000);
    });
  });

  describe('Double-Entry Balance Accounting Integrity', () => {
    it('validates debit sum equals credit sum within 0.01 tolerance', () => {
      const lines = [
        { debit: 1250.50, credit: 0 },
        { debit: 749.50, credit: 0 },
        { debit: 0, credit: 2000.00 }
      ];

      const totalDebits = lines.reduce((s, l) => s + (l.debit || 0), 0);
      const totalCredits = lines.reduce((s, l) => s + (l.credit || 0), 0);
      const isBalanced = Math.abs(totalDebits - totalCredits) <= 0.01;

      expect(isBalanced).toBe(true);
      expect(totalDebits).toBe(2000);
      expect(totalCredits).toBe(2000);
    });

    it('rejects unbalanced journal entries', () => {
      const lines = [
        { debit: 1000, credit: 0 },
        { debit: 0, credit: 950 }
      ];

      const totalDebits = lines.reduce((s, l) => s + (l.debit || 0), 0);
      const totalCredits = lines.reduce((s, l) => s + (l.credit || 0), 0);
      const isBalanced = Math.abs(totalDebits - totalCredits) <= 0.01;

      expect(isBalanced).toBe(false);
      expect(Math.abs(totalDebits - totalCredits)).toBe(50);
    });
  });

  describe('uploadService (Cloudflare R2)', () => {
    it('has required upload methods', () => {
      expect(typeof uploadService.uploadFile).toBe('function');
      expect(typeof uploadService.getStatus).toBe('function');
    });

    it('calls GET /upload/status to query Cloudflare R2 connection', async () => {
      const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
        data: {
          success: true,
          data: {
            r2Configured: true,
            bucketName: 'mybook-documents',
            storageType: 'cloudflare-r2'
          }
        }
      });

      const res = await uploadService.getStatus();
      expect(getSpy).toHaveBeenCalledWith('/upload/status');
      expect(res.data.r2Configured).toBe(true);
    });
  });
});
