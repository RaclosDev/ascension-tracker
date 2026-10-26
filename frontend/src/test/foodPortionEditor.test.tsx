import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FoodPortionEditor, SearchProduct } from '../components/food/FoodPortionEditor';

describe('FoodPortionEditor Component', () => {
  const sampleProduct: SearchProduct = {
    name: 'Avena Suave',
    category: 'Cereales',
    kcal: 375,
    protein: 13.5,
    carbs: 60,
    fat: 7,
    portions: [
      { label: '1 tazón', amount: 40 },
      { label: '1 ración', amount: 50 },
    ],
  };

  it('renders product details and calculated macros correctly for 100g', () => {
    const setQuantity = vi.fn();
    const setInputMode = vi.fn();
    const onConfirmAdd = vi.fn();

    render(
      <FoodPortionEditor
        selectedProduct={sampleProduct}
        quantity={100}
        setQuantity={setQuantity}
        inputMode="grams"
        setInputMode={setInputMode}
        onConfirmAdd={onConfirmAdd}
      />,
    );

    expect(screen.getByText('Avena Suave')).toBeDefined();
    expect(screen.getByText('375 kcal')).toBeDefined();
    expect(screen.getByText('13.5g')).toBeDefined();
    expect(screen.getByText('60.0g')).toBeDefined();
    expect(screen.getByText('7.0g')).toBeDefined();
  });

  it('allows quantity change in grams mode', () => {
    const setQuantity = vi.fn();
    const setInputMode = vi.fn();
    const onConfirmAdd = vi.fn();

    render(
      <FoodPortionEditor
        selectedProduct={sampleProduct}
        quantity={100}
        setQuantity={setQuantity}
        inputMode="grams"
        setInputMode={setInputMode}
        onConfirmAdd={onConfirmAdd}
      />,
    );

    const input = screen.getByLabelText('Cantidad en gramos');
    fireEvent.change(input, { target: { value: '150' } });

    expect(setQuantity).toHaveBeenCalledWith(150);
  });

  it('handles portion buttons click to set predefined amounts', () => {
    const setQuantity = vi.fn();
    const setInputMode = vi.fn();
    const onConfirmAdd = vi.fn();

    render(
      <FoodPortionEditor
        selectedProduct={sampleProduct}
        quantity={100}
        setQuantity={setQuantity}
        inputMode="grams"
        setInputMode={setInputMode}
        onConfirmAdd={onConfirmAdd}
      />,
    );

    const portionButton = screen.getByText('1 tazón (40g)');
    fireEvent.click(portionButton);

    expect(setQuantity).toHaveBeenCalledWith(40);
  });

  it('triggers onConfirmAdd callback when clicking the submit button', () => {
    const setQuantity = vi.fn();
    const setInputMode = vi.fn();
    const onConfirmAdd = vi.fn();

    render(
      <FoodPortionEditor
        selectedProduct={sampleProduct}
        quantity={100}
        setQuantity={setQuantity}
        inputMode="grams"
        setInputMode={setInputMode}
        onConfirmAdd={onConfirmAdd}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /añadir a mi registro/i });
    fireEvent.click(submitBtn);

    expect(onConfirmAdd).toHaveBeenCalledTimes(1);
  });

  it('supports decimal comma in grams and portions without resetting to zero', () => {
    const setQuantity = vi.fn();
    const setInputMode = vi.fn();
    const onConfirmAdd = vi.fn();

    render(
      <FoodPortionEditor
        selectedProduct={sampleProduct}
        quantity={100}
        setQuantity={setQuantity}
        inputMode="grams"
        setInputMode={setInputMode}
        onConfirmAdd={onConfirmAdd}
      />,
    );

    const input = screen.getByLabelText('Cantidad en gramos');
    fireEvent.change(input, { target: { value: '125,5' } });
    expect(setQuantity).toHaveBeenCalledWith(125.5);
  });
});
