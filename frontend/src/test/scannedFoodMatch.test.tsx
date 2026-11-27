import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api/client';
import FoodSearchModal from '../components/FoodSearchModal';
import { findSavedFoodForScan } from '../utils/scannedFood';

const saved = [
  { id: 1, name: 'Arroz integral', brand: 'Hacendado', kcalPer100g: 350 },
  { id: 2, name: 'Pollo a la plancha', brand: '', kcalPer100g: 120 },
];

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../hooks/food/useFoodSearchLists', () => ({
  useFoodSearchLists: () => ({
    recentLogs: [],
    savedFoods: saved,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));
vi.mock('../components/BarcodeScanner', () => ({
  default: ({ onScanSuccess }: { onScanSuccess: (code: string) => void }) => (
    <button onClick={() => onScanSuccess('8410000000017')}>Simular lectura</button>
  ),
}));

function scan(product: Record<string, unknown>) {
  vi.mocked(api.get).mockImplementation((url: string) =>
    Promise.resolve({ status: 200, data: url.startsWith('/food-external/barcode') ? { product } : [] }),
  );
}

async function openScanner() {
  render(<FoodSearchModal isOpen onClose={vi.fn()} date="2026-11-27" mealIndex={0} />);
  fireEvent.click(await screen.findByRole('button', { name: /código de barras/i }));
  fireEvent.click(await screen.findByRole('button', { name: 'Simular lectura' }));
}

describe('scanning a barcode', () => {
  beforeEach(() => vi.resetAllMocks());

  it('opens the form instead of picking a saved food when the product has no name', async () => {
    scan({ brands: 'Marca', nutriments: { proteins_100g: 10, carbohydrates_100g: 20, fat_100g: 5 } });
    await openScanner();

    const name = await screen.findByLabelText(/nombre/i);
    expect(name).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Guardar Alimento' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    // Neither of the two saved foods was selected.
    expect(screen.queryByText(/Arroz integral/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pollo a la plancha/)).not.toBeInTheDocument();
  });

  it('still selects the saved food whose name is exactly the scanned one', async () => {
    scan({ product_name: 'arroz INTEGRAL', brands: 'Hacendado', nutriments: {} });
    await openScanner();

    await waitFor(() => expect(screen.getByText(/Arroz integral/)).toBeInTheDocument());
  });
});

describe('findSavedFoodForScan', () => {
  it('matches nothing for an empty or very short name', () => {
    expect(findSavedFoodForScan(saved, '', '')).toBeUndefined();
    expect(findSavedFoodForScan(saved, '  ', 'Marca')).toBeUndefined();
    expect(findSavedFoodForScan(saved, 'Ar', '')).toBeUndefined();
  });

  it('does not take a saved food just because its name contains the scanned one', () => {
    expect(findSavedFoodForScan(saved, 'Arroz', '')).toBeUndefined();
  });

  it('ignores accents and case, and accepts the name followed by the brand', () => {
    expect(findSavedFoodForScan(saved, 'POLLO A LA PLANCHA', '')?.id).toBe(2);
    const withBrand = [{ id: 3, name: 'Yogur - Danone' }];
    expect(findSavedFoodForScan(withBrand, 'Yogur', 'Danone')?.id).toBe(3);
  });

  it('never returns a recipe or an entry without id', () => {
    const list = [
      { name: 'Tortilla', isRecipe: true, id: 9 },
      { name: 'Tortilla' },
    ];
    expect(findSavedFoodForScan(list, 'Tortilla', '')).toBeUndefined();
  });
});
