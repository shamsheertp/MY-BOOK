import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ContactProfile from '../pages/Contacts/ContactProfile';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  contactsService: {
    getTransactions: vi.fn(),
    getById: vi.fn(),
  },
  salesService: {
    list: vi.fn(),
  },
  purchasesService: {
    list: vi.fn(),
  },
  tokenStorage: {
    getAccessToken: vi.fn(() => 'mock-token'),
    getRefreshToken: vi.fn(() => 'mock-refresh-token'),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clear: vi.fn(),
  },
}));

describe('ContactProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays contact profile and its live transactions from the backend', async () => {
    api.contactsService.getTransactions.mockResolvedValue({
      success: true,
      data: {
        contact: {
          id: 'cont-123',
          code: 'CONT-001',
          contactName: 'Alice Springs',
          companyName: 'Springs Logistics Ltd',
          phone: '+91 98765 43210',
          email: 'alice@springs.com',
          address: 'Industrial Area, Phase 2, Delhi',
          receivables: 12500,
          payables: 0,
        },
        transactions: [
          {
            id: 'sale-1',
            ref: 'SALE-2026001',
            type: 'Sale',
            category: 'Sale',
            date: '2026-10-15',
            amount: 25000,
            received: 12500,
            balance: 12500,
            status: 'PARTIAL',
            paymentMethod: '-',
            notes: 'Steel sheet order',
            link: '/sales/SALE-2026001',
          },
          {
            id: 'pay-1',
            ref: 'PAY-001',
            parentRef: 'SALE-2026001',
            type: 'Payment Received',
            category: 'Payment',
            date: '2026-10-16',
            amount: 12500,
            received: 12500,
            balance: 0,
            status: 'PAID',
            paymentMethod: 'Bank Transfer',
            notes: 'Advance transfer',
            link: '/sales/SALE-2026001',
          },
          {
            id: 'po-1',
            ref: 'PO-2026001',
            type: 'Purchase',
            category: 'Purchase',
            date: '2026-10-10',
            amount: 18000,
            received: 18000,
            balance: 0,
            status: 'COMPLETED',
            paymentMethod: '-',
            notes: 'Raw material procurement',
            link: '/purchases/PO-2026001',
          },
        ],
        summary: {
          totalSalesVolume: 25000,
          totalPurchasesVolume: 18000,
          totalExpensesVolume: 0,
          totalToReceive: 12500,
          totalToPay: 0,
          netBalance: 12500,
          totalReceived: 12500,
          totalPaid: 18000,
          salesCount: 1,
          purchasesCount: 1,
          expensesCount: 0,
          paymentsCount: 1,
          totalCount: 3,
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/contacts/cont-123']}>
        <Routes>
          <Route path="/contacts/:id" element={<ContactProfile />} />
        </Routes>
      </MemoryRouter>
    );

    // Initial state check
    await waitFor(() => {
      expect(screen.getByText('Back to Contacts')).toBeDefined();
    });

    // Verify contact details are rendered
    await waitFor(() => {
      expect(screen.getByText('Alice Springs')).toBeDefined();
      expect(screen.getByText('Springs Logistics Ltd')).toBeDefined();
      expect(screen.getByText('+91 98765 43210')).toBeDefined();
    });

    // Verify transactions are rendered in the table
    await waitFor(() => {
      expect(screen.getByText('SALE-2026001')).toBeDefined();
      expect(screen.getByText('PAY-001')).toBeDefined();
      expect(screen.getByText('PO-2026001')).toBeDefined();
    });

    // Verify badges and types
    expect(screen.getByText('Sale Invoice')).toBeDefined();
    expect(screen.getByText('Payment In')).toBeDefined();
    expect(screen.getByText('Purchase Order')).toBeDefined();

    // Verify KPI summary
    expect(screen.getByText('Total To Receive')).toBeDefined();
    expect(screen.getByText('Sales Volume')).toBeDefined();
    expect(screen.getByText('Purchase Volume')).toBeDefined();
  });
});
