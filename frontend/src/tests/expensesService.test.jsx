import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expensesService } from '../services/api';
import api from '../services/api';

describe('expensesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides all expected expense CRUD and analytics functions', () => {
    expect(typeof expensesService.list).toBe('function');
    expect(typeof expensesService.getSummary).toBe('function');
    expect(typeof expensesService.getCategories).toBe('function');
    expect(typeof expensesService.createCategory).toBe('function');
    expect(typeof expensesService.getById).toBe('function');
    expect(typeof expensesService.create).toBe('function');
    expect(typeof expensesService.update).toBe('function');
    expect(typeof expensesService.void).toBe('function');
    expect(typeof expensesService.delete).toBe('function');
  });

  it('calls correct API endpoint for list with parameters', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        success: true,
        data: {
          expenses: [{ id: 'EXP-001', category: 'Office Supplies', amount: 250 }],
          pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      },
    });

    const result = await expensesService.list({
      page: 1,
      limit: 10,
      search: 'Supplies',
      category: 'Office Supplies',
      status: 'Paid',
    });

    expect(getSpy).toHaveBeenCalledWith(
      '/expenses?page=1&limit=10&search=Supplies&category=Office+Supplies&status=Paid&sortBy=date&sortOrder=desc'
    );
    expect(result.data.expenses.length).toBe(1);
  });

  it('calls correct API endpoint for create', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        success: true,
        data: { id: 'EXP-007', category: 'Travel', amount: 120 },
      },
    });

    const payload = {
      category: 'Travel',
      amount: 120,
      paymentMethod: 'Cash',
      status: 'Paid',
    };

    const result = await expensesService.create(payload);
    expect(postSpy).toHaveBeenCalledWith('/expenses', payload);
    expect(result.data.id).toBe('EXP-007');
  });

  it('calls correct API endpoint for update with PIN', async () => {
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        success: true,
        data: { id: 'EXP-001', category: 'Office Equipment', amount: 350 },
      },
    });

    const payload = {
      category: 'Office Equipment',
      amount: 350,
      pin: '1234',
    };

    const result = await expensesService.update('EXP-001', payload);
    expect(putSpy).toHaveBeenCalledWith('/expenses/EXP-001', payload);
    expect(result.data.amount).toBe(350);
  });

  it('calls correct API endpoint for void with PIN and reason', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        success: true,
        message: 'Expense voided successfully',
        data: { id: 'EXP-001', status: 'Void', voided: true },
      },
    });

    const payload = { pin: '1234', reason: 'Duplicate transaction' };
    const result = await expensesService.void('EXP-001', payload);
    expect(postSpy).toHaveBeenCalledWith('/expenses/EXP-001/void', payload);
    expect(result.data.voided).toBe(true);
  });

  it('calls correct API endpoint for delete', async () => {
    const deleteSpy = vi.spyOn(api, 'delete').mockResolvedValue({
      data: { success: true, message: 'Expense deleted successfully' },
    });

    const result = await expensesService.delete('EXP-001');
    expect(deleteSpy).toHaveBeenCalledWith('/expenses/EXP-001');
    expect(result.success).toBe(true);
  });
});
