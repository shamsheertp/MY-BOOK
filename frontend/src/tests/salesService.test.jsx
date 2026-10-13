import { describe, it, expect, vi, beforeEach } from 'vitest';
import { salesService } from '../services/api';

describe('salesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides list, getById, create, recordPayment, voidPayment, void, and delete functions', () => {
    expect(typeof salesService.list).toBe('function');
    expect(typeof salesService.getById).toBe('function');
    expect(typeof salesService.create).toBe('function');
    expect(typeof salesService.recordPayment).toBe('function');
    expect(typeof salesService.voidPayment).toBe('function');
    expect(typeof salesService.void).toBe('function');
    expect(typeof salesService.delete).toBe('function');
  });
});
