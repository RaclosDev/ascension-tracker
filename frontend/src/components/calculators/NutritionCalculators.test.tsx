// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import NutritionCalculators from './NutritionCalculators';
import api from '../../api/client';

// Mock Recharts
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>
  };
});

// Mock API
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn()
  }
}));

window.scrollTo = vi.fn();

describe('NutritionCalculators', () => {
  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    cleanup();
  });

  it('loads profile from local storage and API', async () => {
    localStorage.setItem('ascension_calc_profile', JSON.stringify({
      sex: 'F', age: '25', heightCm: '165', weightKg: '60', activityFactor: '1.2'
    }));
    
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/weights/dashboard') return Promise.resolve({ data: { currentWeight: { weight: 58 } } });
      if (url === '/settings') return Promise.resolve({ data: { goalWeight: 55, weeklyGoal: 0.5 } });
      return Promise.reject();
    });

    render(<NutritionCalculators />);
    
    expect((screen.getByLabelText('Sexo') as HTMLSelectElement).value).toBe('F');
    expect((screen.getByLabelText('Edad') as HTMLInputElement).value).toBe('25');
    // From local storage, the weight was 60. Since loadedWeight is true, API shouldn't overwrite it
    expect((screen.getByLabelText('Peso actual (kg)') as HTMLInputElement).value).toBe('60');

    const planHeader = screen.getByText('Plan de déficit y plazo');
    fireEvent.click(planHeader);

    // API sets goal weight
    await waitFor(() => {
      expect((screen.getByLabelText('Peso objetivo (kg)') as HTMLInputElement).value).toBe('55');
    });
  });

  it('shows TDEE correctly', async () => {
    render(<NutritionCalculators />);
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'M' } });
    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '180' } });
    fireEvent.change(screen.getByLabelText('Peso actual (kg)'), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Nivel de Actividad'), { target: { value: '1.55' } });

    // Open TDEE accordion
    const tdeeHeader = screen.getByText('Gasto de mantenimiento (TDEE)');
    fireEvent.click(tdeeHeader);
    
    // 1780 * 1.55 = 2759
    expect(screen.getByText('2759 kcal')).toBeInTheDocument();
  });

  it('shows plan warnings if aggressive', async () => {
    render(<NutritionCalculators />);
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'M' } });
    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '180' } });
    fireEvent.change(screen.getByLabelText('Peso actual (kg)'), { target: { value: '80' } });
    
    const planHeader = screen.getByText('Plan de déficit y plazo');
    fireEvent.click(planHeader);

    fireEvent.change(screen.getByLabelText('Peso objetivo (kg)'), { target: { value: '65' } });
    fireEvent.change(screen.getByLabelText('Plazo (semanas)'), { target: { value: '4' } });

    // Should show unreachable
    expect(screen.getByText(/Inalcanzable/i)).toBeInTheDocument();
  });

  it('shows macros with overbudget warning', async () => {
    render(<NutritionCalculators />);
    fireEvent.change(screen.getByLabelText('Peso actual (kg)'), { target: { value: '80' } });
    
    const macrosHeader = screen.getByText('Macros por peso corporal');
    fireEvent.click(macrosHeader);

    // Kcal 1000, 80kg -> P=160g(640kcal) F=60g(540kcal) = 1180. Overbudget 180.
    fireEvent.change(screen.getByLabelText('Calorías a repartir'), { target: { value: '1000' } });
    
    expect(screen.getByText(/Proteínas y grasas suman más calorías que tu objetivo total/i)).toBeInTheDocument();
    expect(screen.getByText(/Faltan 180 kcal/i)).toBeInTheDocument();
    expect(screen.getByText('0g')).toBeInTheDocument(); // Carbs
  });

  it('shows hip input only for females in Navy body fat', async () => {
    render(<NutritionCalculators />);
    const bfHeader = screen.getByText('% de grasa corporal (método Marina)');
    fireEvent.click(bfHeader);

    // By default sex is M, no hip
    expect(screen.queryByLabelText('Cadera (cm)')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'F' } });
    expect(screen.getByLabelText('Cadera (cm)')).toBeInTheDocument();
  });
});
