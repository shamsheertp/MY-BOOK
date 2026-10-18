import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contactsService } from '../services/api';

describe('contactsService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides list, getById, getTransactions, create, update, and delete functions', () => {
    expect(typeof contactsService.list).toBe('function');
    expect(typeof contactsService.getById).toBe('function');
    expect(typeof contactsService.getTransactions).toBe('function');
    expect(typeof contactsService.create).toBe('function');
    expect(typeof contactsService.update).toBe('function');
    expect(typeof contactsService.delete).toBe('function');
  });
});
