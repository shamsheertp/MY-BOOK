import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreatePurchase from '../pages/Purchases/CreatePurchase';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  contactsService: {
    list: vi.fn(),
  },
  productsService: {
    list: vi.fn(),
  },
  purchasesService: {
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

describe('CreatePurchase Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without pre-selecting a supplier and without pre-filled 5% tax', async () => {
    api.contactsService.list.mockResolvedValue({
      success: true,
      data: {
        contacts: [
          { id: 'c1', contactName: 'Guru Metals Kannur', companyName: 'Guru Metals' },
          { id: 'c2', contactName: 'Pothuval Metal', companyName: 'Pothuval Metals' },
        ],
        pagination: { total: 2 },
      },
    });

    api.productsService.list.mockResolvedValue({
      success: true,
      data: [
        { id: 'p1', name: 'Copper Scrap Grade A', costPricePerKg: 650 },
      ],
    });

    render(
      <BrowserRouter>
        <CreatePurchase />
      </BrowserRouter>
    );

    expect(screen.getByText('New Purchase Order')).toBeDefined();
    expect(screen.getByText('Supplier / Contact *')).toBeDefined();

    // Verify search placeholder is shown instead of auto-selecting the first supplier
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search supplier by name, company, phone...');
      expect(searchInput).toBeDefined();
    });

    // Verify inputs have placeholder "0" and are not pre-filled with numbers
    const zeroPlaceholderInputs = screen.getAllByPlaceholderText('0');
    expect(zeroPlaceholderInputs.length).toBe(2);
    expect(zeroPlaceholderInputs[0].value).toBe(''); // qty
    expect(zeroPlaceholderInputs[1].value).toBe(''); // tax

    // Verify cost price and discount placeholder is 0.00 and values are empty
    const priceInputs = screen.getAllByPlaceholderText('0.00');
    expect(priceInputs.length).toBe(2); // cost price & discount
    expect(priceInputs[0].value).toBe('');
    expect(priceInputs[1].value).toBe('');
  });

  it('allows typing decimals in price and formats with commas on blur', async () => {
    api.contactsService.list.mockResolvedValue({ success: true, data: [] });
    api.productsService.list.mockResolvedValue({ success: true, data: [] });

    const { fireEvent } = await import('@testing-library/react');

    render(
      <BrowserRouter>
        <CreatePurchase />
      </BrowserRouter>
    );

    const priceInput = screen.getAllByPlaceholderText('0.00')[0];
    const qtyInput = screen.getAllByPlaceholderText('0')[0];

    // Type decimal in qty
    fireEvent.change(qtyInput, { target: { value: '250.75' } });
    fireEvent.blur(qtyInput);
    expect(qtyInput.value).toBe('250.75');

    // Type decimal in cost price
    fireEvent.change(priceInput, { target: { value: '12300.50' } });
    expect(priceInput.value).toBe('12300.50');

    // On blur, format with Indian commas
    fireEvent.blur(priceInput);
    expect(priceInput.value).toBe('12,300.50');
  });

  it('displays auto-add notice when typing an unlisted product name', async () => {
    api.contactsService.list.mockResolvedValue({ success: true, data: [] });
    api.productsService.list.mockResolvedValue({
      success: true,
      data: [{ id: 'p1', name: 'Aluminium Ingot', costPricePerKg: 190 }],
    });

    const { fireEvent } = await import('@testing-library/react');

    render(
      <BrowserRouter>
        <CreatePurchase />
      </BrowserRouter>
    );

    const productInput = screen.getByPlaceholderText('Type material name or select...');
    fireEvent.change(productInput, { target: { value: 'brazee' } });

    await waitFor(() => {
      expect(screen.getByText(/not in catalog — will automatically save to product DB/i)).toBeDefined();
    });
  });
});
