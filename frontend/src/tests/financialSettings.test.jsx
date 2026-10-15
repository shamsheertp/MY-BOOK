import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expensesService, paymentMethodsService } from '../services/api';
import api from '../services/api';

describe('Financial Settings & Payment Methods Services', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides all expected payment method CRUD functions', () => {
    expect(typeof paymentMethodsService.getAll).toBe('function');
    expect(typeof paymentMethodsService.create).toBe('function');
    expect(typeof paymentMethodsService.update).toBe('function');
    expect(typeof paymentMethodsService.delete).toBe('function');
  });

  it('provides category update and delete functions on expensesService', () => {
    expect(typeof expensesService.updateCategory).toBe('function');
    expect(typeof expensesService.deleteCategory).toBe('function');
  });

  it('paymentMethodsService.getAll calls GET /payment-methods', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        success: true,
        data: [
          { id: '1', name: 'Cash', code: 'CASH', type: 'CASH', isDefault: true },
          { id: '2', name: 'UPI', code: 'UPI', type: 'UPI', isDefault: false },
        ],
      },
    });

    const res = await paymentMethodsService.getAll();
    expect(getSpy).toHaveBeenCalledWith('/payment-methods');
    expect(res.data.length).toBe(2);
    expect(res.data[0].name).toBe('Cash');
  });

  it('paymentMethodsService.create calls POST /payment-methods', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        success: true,
        data: { id: '3', name: 'Credit Card', code: 'CARD', type: 'CARD', isDefault: false },
      },
    });

    const payload = { name: 'Credit Card', code: 'CARD', type: 'CARD' };
    const res = await paymentMethodsService.create(payload);
    expect(postSpy).toHaveBeenCalledWith('/payment-methods', payload);
    expect(res.data.name).toBe('Credit Card');
  });

  it('paymentMethodsService.update calls PUT /payment-methods/:id', async () => {
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        success: true,
        data: { id: '3', name: 'Credit Card (Corporate)', isDefault: true },
      },
    });

    const updatePayload = { name: 'Credit Card (Corporate)', isDefault: true };
    const res = await paymentMethodsService.update('3', updatePayload);
    expect(putSpy).toHaveBeenCalledWith('/payment-methods/3', updatePayload);
    expect(res.data.isDefault).toBe(true);
  });

  it('paymentMethodsService.delete calls DELETE /payment-methods/:id', async () => {
    const delSpy = vi.spyOn(api, 'delete').mockResolvedValue({
      data: { success: true, message: 'Deleted' },
    });

    const res = await paymentMethodsService.delete('3');
    expect(delSpy).toHaveBeenCalledWith('/payment-methods/3');
    expect(res.success).toBe(true);
  });

  it('expensesService.updateCategory calls PUT /expenses/categories/:id', async () => {
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({
      data: {
        success: true,
        data: { id: 'cat-1', name: 'Office & Supplies', color: '#10b981' },
      },
    });

    const catData = { name: 'Office & Supplies', color: '#10b981' };
    const res = await expensesService.updateCategory('cat-1', catData);
    expect(putSpy).toHaveBeenCalledWith('/expenses/categories/cat-1', catData);
    expect(res.data.name).toBe('Office & Supplies');
  });

  it('expensesService.deleteCategory calls DELETE /expenses/categories/:id', async () => {
    const delSpy = vi.spyOn(api, 'delete').mockResolvedValue({
      data: { success: true, message: 'Deleted' },
    });

    const res = await expensesService.deleteCategory('cat-1');
    expect(delSpy).toHaveBeenCalledWith('/expenses/categories/cat-1');
    expect(res.success).toBe(true);
  });
});
