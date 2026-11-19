import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from '@/components/ui/select';
import { chooseOption } from './selectMenu';

function renderSelect(props: Partial<Parameters<typeof Select>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <label>
      Orden
      <Select name="orden" value="b" onChange={onChange} {...props}>
        <option value="a">Alfa</option>
        <option value="b">Beta</option>
        <hr />
        <option value="c" disabled>
          Gamma
        </option>
        <option value="d">Delta</option>
      </Select>
    </label>,
  );
  return { onChange, trigger: screen.getByLabelText('Orden') };
}

describe('Select', () => {
  it('muestra el valor actual en un botón que abre un menú', () => {
    const { trigger } = renderSelect();
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveTextContent('Beta');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const menu = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    expect(menu).toHaveAttribute('role', 'menu');
    expect(menu).toHaveAttribute('popover', 'auto');
  });

  it('marca la opción elegida y separa con un separador', () => {
    renderSelect();
    const items = screen.getAllByRole('menuitemradio', { hidden: true });
    expect(items.map((i) => i.textContent)).toEqual(['Alfa', 'Beta', 'Gamma', 'Delta']);
    expect(items[1]).toHaveAttribute('aria-checked', 'true');
    expect(items[0]).toHaveAttribute('aria-checked', 'false');
    expect(items[2]).toBeDisabled();
    expect(screen.getAllByRole('separator', { hidden: true })).toHaveLength(1);
  });

  it('avisa del cambio con el valor y el nombre, y no si se repite el mismo', () => {
    const { onChange, trigger } = renderSelect();
    chooseOption(trigger, 'd');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target).toEqual({ value: 'd', name: 'orden' });
    chooseOption(trigger, 'b');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('acepta valores numéricos', () => {
    const onChange = vi.fn();
    render(
      <Select aria-label="Semana" value={2} onChange={onChange}>
        <option value={1}>Semana 1</option>
        <option value={2}>Semana 2</option>
      </Select>,
    );
    expect(screen.getByLabelText('Semana')).toHaveTextContent('Semana 2');
    chooseOption(screen.getByLabelText('Semana'), '1');
    expect(onChange.mock.calls[0][0].target.value).toBe('1');
  });

  it('se mueve con flechas, Inicio y Fin saltando las deshabilitadas', () => {
    renderSelect();
    // jsdom no abre popovers: se muestra el menú a mano para poder enfocar sus opciones.
    const style = document.head.appendChild(document.createElement('style'));
    style.textContent = '.ui-select-menu { display: block !important; }';
    const [alfa, beta, , delta] = screen.getAllByRole('menuitemradio', { hidden: true });
    beta.focus();
    fireEvent.keyDown(beta, { key: 'ArrowDown' });
    expect(delta).toHaveFocus();
    fireEvent.keyDown(delta, { key: 'ArrowDown' });
    expect(alfa).toHaveFocus();
    fireEvent.keyDown(alfa, { key: 'End' });
    expect(delta).toHaveFocus();
    fireEvent.keyDown(delta, { key: 'Home' });
    expect(alfa).toHaveFocus();
    fireEvent.keyDown(alfa, { key: 'ArrowUp' });
    expect(delta).toHaveFocus();
    style.remove();
  });

  it('ofrece una acción extra al final', () => {
    const onSelect = vi.fn();
    renderSelect({ action: { label: 'Nueva…', onSelect } });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Nueva…', hidden: true }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('no propaga la elección a la tarjeta que lo contiene', () => {
    const onCardClick = vi.fn();
    const onChange = vi.fn();
    render(
      <div onClick={onCardClick}>
        <Select aria-label="Descanso" value="60" onChange={onChange}>
          <option value="60">1 min</option>
          <option value="90">1:30</option>
        </Select>
      </div>,
    );
    fireEvent.click(screen.getByRole('menuitemradio', { name: '1:30', hidden: true }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCardClick).not.toHaveBeenCalled();
  });
});
