import { cn } from '../../lib/utils';

export interface SegmentedControlOption {
  label: string;
  value: string;
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'flex w-full p-1.5 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.5)] gap-1',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer text-center truncate',
              isActive
                ? 'backdrop-blur-xl bg-gradient-to-b from-white/15 to-white/5 text-white font-bold border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_15px_var(--accent-glow)]'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
