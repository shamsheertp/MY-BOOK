import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateInvoice from '../pages/Sales/CreateInvoice';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  contactsService: {
    list: vi.fn(),
  },
  productsService: {
    list: vi.fn(),
  },
  salesService: {
    create: vi.fn(),
  },
  tokenStorage: {
    getAccessToken: vi.fn(() => 'mock-access-token'),
    getRefreshToken: vi.fn(() => 'mock-refresh-token'),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('CreateInvoice Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without error and maps contacts array from database response', async () => {
    api.contactsService.list.mockResolvedValue({
      success: true,
      data: {
        contacts: [
          { id: 'c1', contactName: 'John Smith', companyName: 'Acme Corp' },
          { id: 'c2', contactName: 'Sarah Johnson', companyName: 'TechCorp' },
        ],
        pagination: { total: 2 },
      },
    });

    api.productsService.list.mockResolvedValue({
      success: true,
      data: [
        { id: 'p1', name: 'Stainless Steel 304 Sheet', sellingPricePerKg: 345 },
      ],
    });

    render(
      <BrowserRouter>
        <CreateInvoice />
      </BrowserRouter>
    );

    expect(screen.getByText('New Invoice')).toBeDefined();
    expect(screen.getByText('Billed To (Customer) *')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('John Smith (Acme Corp)')).toBeDefined();
      expect(screen.getByText('Sarah Johnson (TechCorp)')).toBeDefined();
    });
  });

  it('handles empty or legacy data structure without crashing', async () => {
    api.contactsService.list.mockResolvedValue({
      success: true,
      data: [],
    });

    api.productsService.list.mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <BrowserRouter>
        <CreateInvoice />
      </BrowserRouter>
    );

    expect(screen.getByText('New Invoice')).toBeDefined();
  });
});
