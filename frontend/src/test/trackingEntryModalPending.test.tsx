import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { TrackingEntryModal } from '../components/tracking/TrackingEntryModal';
import type { TrackingModalData } from '../types/tracking';

const modalData = {
  fullLabel: 'lunes 1 de noviembre',
  dayData: { weight: 80, steps: 100, calories: null },
} as unknown as TrackingModalData;

function mount(pending: boolean, onClose: () => void) {
  render(
    <TrackingEntryModal
      pending={pending}
      modalData={modalData}
      modalWeight="80"
      modalSteps="100"
      weightDeltas={[]}
      stepsDeltas={[]}
      onWeightChange={vi.fn()}
      onStepsChange={vi.fn()}
      onDeltaAdjust={vi.fn()}
      onSave={vi.fn()}
      onDelete={vi.fn()}
      onClose={onClose}
    />,
  );
}

it('cannot be closed with the buttons while it is saving', () => {
  const onClose = vi.fn();
  mount(true, onClose);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal de edición' }));
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
});

it('closes normally when it is not saving', () => {
  const onClose = vi.fn();
  mount(false, onClose);
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
