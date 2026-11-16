import { QueryErrorNotice } from '../QueryErrorNotice';
import { ActivityCalendar } from '../ui/ActivityCalendar';
import { Skeleton } from '../ui/skeleton';
import { useCalendarEntries } from '../../hooks/useCalendarEntries';

const kcalFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });

export function NutritionCalendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const { data, isLoading, isError, isFetching, refetch } = useCalendarEntries('meals');

  return (
    <section className="card" aria-labelledby="nutrition-calendar-title">
      <h2 id="nutrition-calendar-title" className="mb-3 font-semibold">
        Calendario de comidas
      </h2>
      {isError && <QueryErrorNotice retry={refetch} pending={isFetching} />}
      {isLoading && <Skeleton className="h-80 w-full" />}
      {data && (
        <ActivityCalendar
          values={data}
          selectedDate={selectedDate}
          onSelect={onSelect}
          formatValue={(value) => `${kcalFormat.format(value)} kcal`}
        />
      )}
    </section>
  );
}
