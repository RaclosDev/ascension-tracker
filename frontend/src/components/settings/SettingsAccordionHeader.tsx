import React from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface SettingsAccordionHeaderProps {
  panelId: string;
  title: string;
  icon: LucideIcon;
  isOpen: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * The negative vertical margin cancels the extra height from min-h-11, so the
 * 44px touch area overlaps the card padding instead of changing the layout.
 */
export function SettingsAccordionHeader({
  panelId,
  title,
  icon: Icon,
  isOpen,
  onToggle,
}: SettingsAccordionHeaderProps) {
  return (
    <button
      type="button"
      className="accordion-header flex justify-between items-center w-full min-h-11 -my-2.5 p-0 border-none bg-transparent text-left cursor-pointer select-none"
      aria-expanded={isOpen}
      aria-controls={panelId}
      onClick={onToggle}
    >
      <span className="flex items-center gap-2">
        <Icon size={20} className="text-primary" aria-hidden="true" />
        <span className="card-title m-0 text-base font-semibold">{title}</span>
      </span>
      <span
        className={`text-xs text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
      >
        <ChevronDown size={18} aria-hidden="true" />
      </span>
    </button>
  );
}
