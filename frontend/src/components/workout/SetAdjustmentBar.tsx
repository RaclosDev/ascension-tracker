import type { SyntheticEvent } from 'react';

interface Props {
  label: string;
  negative: number[];
  positive: number[];
  onAdjust: (delta: number) => void;
  onInteract: () => void;
}

export function SetAdjustmentBar({ label, negative, positive, onAdjust, onInteract }: Props) {
  const keepInputFocus = (event: SyntheticEvent) => {
    event.preventDefault();
    onInteract();
  };
  const renderButtons = (values: number[], increase: boolean) =>
    values.map((delta) => (
      <button
        key={delta}
        type="button"
        onMouseDown={keepInputFocus}
        onTouchStart={keepInputFocus}
        onClick={(event) => {
          keepInputFocus(event);
          onAdjust(delta);
        }}
        className={`px-3 py-2 min-h-[40px] min-w-[42px] flex items-center justify-center rounded-xl text-white tabular-nums text-xs transition select-none touch-manipulation ${increase ? 'bg-[var(--accent-primary)] hover:brightness-110 active:scale-95 font-bold shadow-sm' : 'bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 font-semibold'}`}
      >
        {increase ? '+' : ''}
        {delta}
      </button>
    ));
  return (
    <div
      onMouseDown={keepInputFocus}
      onTouchStart={keepInputFocus}
      className="flex items-center justify-between gap-1 px-3 py-2 mt-1.5 bg-[#1C1C1E] border border-[var(--accent-primary)]/40 rounded-xl text-xs shadow-lg animate-fadeIn z-10 relative select-none"
    >
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-[var(--accent-primary-light)] pr-1">
          {label}
        </span>
        {renderButtons(negative, false)}
      </div>
      <div className="h-4 w-px bg-white/20" />
      <div className="flex items-center gap-1">{renderButtons(positive, true)}</div>
    </div>
  );
}
