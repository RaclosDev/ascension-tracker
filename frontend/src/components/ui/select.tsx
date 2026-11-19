import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

/** Lo mínimo de un evento `change` de `<select>`: así cada `onChange` sigue leyendo `e.target.value`. */
export interface SelectChangeEvent {
  target: { value: string; name: string };
  currentTarget: { value: string; name: string };
}

export interface SelectAction {
  label: ReactNode;
  onSelect: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  value: string | number;
  onChange: (event: SelectChangeEvent) => void;
  /** Opciones como en un `<select>`: `<option>` (con `disabled`/`hidden`) y `<hr />` como separador. */
  children: ReactNode;
  /** Acción extra al final del menú (p. ej. «Nueva…»), separada de las opciones. */
  action?: SelectAction;
  id?: string;
  name?: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  hidden?: boolean;
  title?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

type Entry =
  | { kind: 'option'; value: string; label: ReactNode; disabled: boolean; hidden: boolean }
  | { kind: 'separator' };

type OptionProps = {
  value?: string | number;
  children?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
};

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return '';
}

function collect(children: ReactNode, out: Entry[] = []): Entry[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<OptionProps>;
    if (el.type === Fragment) collect(el.props.children, out);
    else if (el.type === 'hr') out.push({ kind: 'separator' });
    else if (el.type === 'option') {
      const { value, children: label, disabled, hidden } = el.props;
      out.push({
        kind: 'option',
        value: value == null ? textOf(label) : String(value),
        label,
        disabled: Boolean(disabled),
        hidden: Boolean(hidden),
      });
    }
  });
  return out;
}

const GAP = 6;
const EDGE = 8;

/**
 * Desplegable con el estilo de papel y tinta de la app (el `<select>` nativo no se deja maquetar).
 * Botón con el valor actual y un menú en popover nativo: Escape y clic fuera lo cierran.
 */
export function Select({
  value,
  onChange,
  children,
  action,
  id,
  name = '',
  className,
  style,
  disabled,
  hidden,
  title,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}: SelectProps) {
  const autoId = useId();
  const triggerId = id ?? `${autoId}-trigger`;
  const menuId = `${autoId}-menu`;
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  const entries = collect(children);
  const options = entries.filter(
    (e): e is Extract<Entry, { kind: 'option' }> => e.kind === 'option',
  );
  const current = String(value);
  const selected = options.find((o) => o.value === current) ?? options[0];

  const place = useCallback(() => {
    const b = btn.current?.getBoundingClientRect();
    const p = pop.current;
    if (!b || !p) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    p.style.minWidth = `${Math.min(Math.max(180, b.width), vw - EDGE * 2)}px`;
    const below = vh - b.bottom - GAP - EDGE;
    const above = b.top - GAP - EDGE;
    const up = p.scrollHeight > below && above > below;
    p.style.maxHeight = `${Math.max(160, up ? above : below)}px`;
    const left = Math.min(Math.max(EDGE, b.left), vw - p.offsetWidth - EDGE);
    p.style.left = `${Math.max(EDGE, left)}px`;
    p.style.top = up ? `${Math.max(EDGE, b.top - GAP - p.offsetHeight)}px` : `${b.bottom + GAP}px`;
  }, []);

  useEffect(() => {
    if (!open) return;
    // Escape cierra solo el menú: se intercepta antes que los diálogos que lo contienen.
    const onEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      pop.current?.hidePopover?.();
      btn.current?.focus();
    };
    const onMove = () => place();
    window.addEventListener('keydown', onEscape, true);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('keydown', onEscape, true);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, place]);

  const items = () => [
    ...(pop.current?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)') ??
      []),
  ];

  const close = () => {
    pop.current?.hidePopover?.();
    btn.current?.focus();
  };

  const pick = (next: string) => {
    close();
    if (next === current) return;
    const target = { value: next, name };
    onChange({ target, currentTarget: target });
  };

  const onMenuKey = (e: KeyboardEvent<HTMLSpanElement>) => {
    const all = items();
    if (!all.length) return;
    if (e.key === 'Tab') {
      pop.current?.hidePopover?.();
      btn.current?.focus();
      return;
    }
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    let to: number | null = null;
    if (e.key === 'ArrowDown') to = i + 1;
    else if (e.key === 'ArrowUp') to = i - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = all.length - 1;
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Escribir una letra salta a la siguiente opción que empieza por ella, como en el nativo.
      const ch = e.key.toLocaleLowerCase('es');
      const order = [...all.slice(i + 1), ...all.slice(0, i + 1)];
      order.find((el) => el.textContent?.trim().toLocaleLowerCase('es').startsWith(ch))?.focus();
      return;
    }
    if (to == null) return;
    e.preventDefault();
    all[(to + all.length) % all.length]?.focus();
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    pop.current?.showPopover?.();
  };

  // Elegir no es un clic en la tarjeta o fila que contiene el campo, igual que con el nativo.
  // Y dentro de un <label>, un clic en el hueco del menú reabriría el botón: se anula.
  const onMenuClick = (e: MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    if (!(e.target as HTMLElement).closest('[role^="menuitem"]')) e.preventDefault();
  };

  const visible = entries.filter((e) => e.kind === 'separator' || !e.hidden);

  return (
    <>
      <button
        ref={btn}
        id={triggerId}
        type="button"
        name={name || undefined}
        className={cn('ui-select', className)}
        style={style}
        disabled={disabled}
        hidden={hidden}
        title={title}
        popoverTarget={menuId}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-value={current}
        onKeyDown={onTriggerKey}
      >
        <span className="ui-select-value">{selected?.label}</span>
        <ChevronDown className="ui-select-chevron" size={16} aria-hidden="true" />
      </button>
      {!hidden && (
        <span
          ref={pop}
          id={menuId}
          popover="auto"
          role="menu"
          className="ui-select-menu"
          onKeyDown={onMenuKey}
          onClick={onMenuClick}
          onBeforeToggle={(e) => {
            // Primera colocación antes de pintarse, para que no aparezca un instante en otro sitio.
            const b = btn.current?.getBoundingClientRect();
            const p = pop.current;
            if ((e.nativeEvent as ToggleEvent).newState !== 'open' || !b || !p) return;
            p.style.left = `${Math.max(EDGE, b.left)}px`;
            p.style.top = `${b.bottom + GAP}px`;
          }}
          onToggle={(e) => {
            const isOpen = (e.nativeEvent as ToggleEvent).newState === 'open';
            setOpen(isOpen);
            if (!isOpen) return;
            place();
            const all = items();
            (all.find((el) => el.getAttribute('aria-checked') === 'true') ?? all[0])?.focus();
          }}
        >
          {visible.map((entry, index) =>
            entry.kind === 'separator' ? (
              <span key={`sep-${index}`} role="separator" className="ui-select-separator" />
            ) : (
              <button
                key={entry.value}
                type="button"
                role="menuitemradio"
                aria-checked={entry.value === selected?.value}
                disabled={entry.disabled}
                data-value={entry.value}
                className="ui-select-item"
                onClick={() => pick(entry.value)}
              >
                <span className="ui-select-check" aria-hidden="true">
                  {entry.value === selected?.value && <Check size={15} strokeWidth={2.75} />}
                </span>
                <span className="ui-select-label">{entry.label}</span>
              </button>
            ),
          )}
          {action && (
            <>
              <span role="separator" className="ui-select-separator" />
              <button
                type="button"
                role="menuitem"
                disabled={action.disabled}
                className="ui-select-item ui-select-action"
                onClick={() => {
                  close();
                  action.onSelect();
                }}
              >
                <span className="ui-select-check" aria-hidden="true">
                  {action.icon}
                </span>
                <span className="ui-select-label">{action.label}</span>
              </button>
            </>
          )}
        </span>
      )}
    </>
  );
}
