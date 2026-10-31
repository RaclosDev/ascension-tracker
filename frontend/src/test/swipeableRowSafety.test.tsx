import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SwipeableRow } from '../components/SwipeableRow';

afterEach(cleanup);
it.each(['touchEnd', 'touchCancel'] as const)(
  '%s never dispatches a duplicate destructive action',
  (event) => {
    const onDelete = vi.fn();
    render(
      <StrictMode>
        <SwipeableRow onDelete={onDelete} onEdit={vi.fn()}>
          <p>Food</p>
        </SwipeableRow>
      </StrictMode>,
    );
    const content = screen.getByText('Food').parentElement!;
    fireEvent.touchStart(content, { touches: [{ clientX: 100, clientY: 0 }] });
    fireEvent.touchMove(content, { touches: [{ clientX: 10, clientY: 0 }] });
    fireEvent[event](content);
    expect(onDelete).toHaveBeenCalledTimes(event === 'touchEnd' ? 1 : 0);
  },
);

it('exposes named actions on keyboard focus without hidden tab stops', () => {
  const edit = vi.fn();
  render(
    <SwipeableRow onDelete={vi.fn()} onEdit={edit}>
      <p>Food</p>
    </SwipeableRow>,
  );
  expect(screen.queryAllByRole('button')).toHaveLength(0);
  fireEvent.focus(screen.getByRole('group'));
  fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
  expect(edit).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('button')).toHaveLength(2);
});
