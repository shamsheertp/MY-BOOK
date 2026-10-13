import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from '../services/api';

describe('productsService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides list, getById, getCategories, create, update, adjustStock, and delete functions', () => {
    expect(typeof productsService.list).toBe('function');
    expect(typeof productsService.getCategories).toBe('function');
    expect(typeof productsService.getById).toBe('function');
    expect(typeof productsService.create).toBe('function');
    expect(typeof productsService.update).toBe('function');
    expect(typeof productsService.adjustStock).toBe('function');
    expect(typeof productsService.delete).toBe('function');
  });
});
