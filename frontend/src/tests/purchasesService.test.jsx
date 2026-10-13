import { describe, it, expect, vi, beforeEach } from 'vitest';
import { purchasesService } from '../services/api';

describe('purchasesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides all expected purchase and inventory lifecycle functions', () => {
    expect(typeof purchasesService.list).toBe('function');
    expect(typeof purchasesService.getById).toBe('function');
    expect(typeof purchasesService.create).toBe('function');
    expect(typeof purchasesService.createReceipt).toBe('function');
    expect(typeof purchasesService.voidReceipt).toBe('function');
    expect(typeof purchasesService.createBill).toBe('function');
    expect(typeof purchasesService.voidBill).toBe('function');
    expect(typeof purchasesService.recordPayment).toBe('function');
    expect(typeof purchasesService.voidPayment).toBe('function');
    expect(typeof purchasesService.void).toBe('function');
    expect(typeof purchasesService.delete).toBe('function');
  });
});
