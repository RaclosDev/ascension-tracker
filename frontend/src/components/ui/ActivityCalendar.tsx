import { useState, type CSSProperties } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { capitalizeFirst, getLocalDateString } from '../../utils/dateHelper';
import './activity-calendar.css';

const levels = [0.25, 0.5, 0.75, 1];

interface ActivityCalendarProps {
  values: ReadonlyMap<string, number>;
  formatValue: (value: number) => string;
  showIntensity?: boolean;
  selectedDate?: string;
  onSelect?: (date: string) => void;
}

export function ActivityCalendar({
  values,
  formatValue,
  showIntensity = true,
  selectedDate,
  onSelect,
}: ActivityCalendarProps) {
  const today = new Date();
  const todayKey = getLocalDateString(today);
  const [month, setMonth] = useState(() => {
    const initial =
      selectedDate && selectedDate < todayKey ? new Date(`${selectedDate}T00:00:00`) : today;
    return startOfMonth(initial);
  });
  const previousMonth = addMonths(month, -1);
  const latestMonth = month >= startOfMonth(today);
  const maxValue = Math.max(1, ...values.values());

  return (
    <div className="activity-calendar">
      <div className="activity-calendar-navigation">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setMonth(addMonths(month, -1))}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <h4 aria-live="polite">
          {capitalizeFirst(format(previousMonth, 'MMM yyyy', { locale: es }))}
          <span aria-hidden="true"> – </span>
          {capitalizeFirst(format(month, 'MMM yyyy', { locale: es }))}
        </h4>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={latestMonth}
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <div
        className={`activity-calendar-months${onSelect ? ' activity-calendar-months-interactive' : ''}`}
      >
        {[month, previousMonth].map((start) => (
          <div key={getLocalDateString(start)}>
            <h5>{capitalizeFirst(format(start, 'MMMM yyyy', { locale: es }))}</h5>
            <div className="activity-calendar-days">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                <span key={day} className="activity-calendar-weekday" aria-hidden="true">
                  {day}
                </span>
              ))}
              {Array.from({ length: (getDay(start) + 6) % 7 }, (_, index) => (
                <span key={`empty-${index}`} aria-hidden="true" />
              ))}
              {eachDayOfInterval({ start, end: endOfMonth(start) }).map((day) => {
                const date = getLocalDateString(day);
                const value = values.get(date);
                const ratio = (value ?? 0) / maxValue;
                const intensity = ratio > 0.75 ? 1 : ratio > 0.45 ? 0.75 : ratio > 0.2 ? 0.5 : 0.25;
                const strength = showIntensity ? intensity : 0.5;
                const label = capitalizeFirst(
                  format(day, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
                );
                const title = value === undefined ? label : `${label} · ${formatValue(value)}`;
                const className = 'activity-calendar-day';
                const style =
                  value === undefined
                    ? undefined
                    : ({ '--calendar-strength': strength } as CSSProperties);
                const props = {
                  className,
                  style,
                  title,
                  'data-today': date === todayKey,
                  'data-intense': value !== undefined && strength > 0.5,
                };

                return onSelect ? (
                  <button
                    {...props}
                    key={date}
                    type="button"
                    aria-label={
                      value === undefined && date <= todayKey ? `${label} · Sin registro` : title
                    }
                    aria-current={date === todayKey ? 'date' : undefined}
                    aria-pressed={selectedDate === date}
                    disabled={date > todayKey}
                    onClick={() => onSelect(date)}
                  >
                    {day.getDate()}
                  </button>
                ) : (
                  <span {...props} key={date}>
                    {day.getDate()}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="activity-calendar-legend">
        <span>{showIntensity ? 'Menos' : 'Sin registro'}</span>
        <div aria-hidden="true">
          <span />
          {(showIntensity ? levels : [0.5]).map((strength) => (
            <span key={strength} style={{ '--calendar-strength': strength } as CSSProperties} />
          ))}
        </div>
        <span>{showIntensity ? 'Más' : 'Con registro'}</span>
      </div>
    </div>
  );
}
