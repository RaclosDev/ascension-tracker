import { useRef, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Footprints, Scale } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { QueryErrorNotice } from '../components/QueryErrorNotice';
import { TrackingNavigation } from '../components/tracking/TrackingNavigation';
import { ActivityCalendar } from '../components/ui/ActivityCalendar';
import { Skeleton } from '../components/ui/skeleton';
import { useCalendarEntries } from '../hooks/useCalendarEntries';
import { confirmAction } from '../lib/confirmation';
import { capitalizeFirst, getLocalDateString } from '../utils/dateHelper';
import { applyTrackingChanges, parseTrackingInputs } from '../utils/trackingMutations';

type Metric = 'weight' | 'steps';
const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

export default function TrackingMetricPage({ metric }: { metric: Metric }) {
  const [date, setDate] = useState(getLocalDateString);
  const entryRef = useRef<HTMLDivElement>(null);
  const query = useCalendarEntries(metric);
  const isWeight = metric === 'weight';
  const title = isWeight ? 'Peso' : 'Pasos';
  const Icon = isWeight ? Scale : Footprints;
  const formatValue = (value: number) =>
    `${numberFormat.format(value)} ${isWeight ? 'kg' : 'pasos'}`;

  return (
    <div className="fade-in">
      <h1 className="page-title-desktop">{title}</h1>
      <TrackingNavigation />
      {query.isError && <QueryErrorNotice retry={query.refetch} pending={query.isFetching} />}
      {query.isLoading && <Skeleton className="h-80 w-full" />}
      {query.data && (
        <div className="grid gap-4">
          <section className="card">
            <h2 className="mb-3 font-semibold">Calendario</h2>
            <ActivityCalendar
              values={query.data}
              formatValue={formatValue}
              showIntensity={!isWeight}
              selectedDate={date}
              onSelect={(selectedDate) => {
                setDate(selectedDate);
                entryRef.current?.focus();
              }}
            />
          </section>
          <div ref={entryRef} tabIndex={-1} aria-label="Registro del día">
            <MetricEntry
              key={date}
              date={date}
              metric={metric}
              value={query.data.get(date) ?? null}
              label={title}
              icon={<Icon size={18} aria-hidden="true" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricEntry({
  date,
  metric,
  value,
  label,
  icon,
}: {
  date: string;
  metric: Metric;
  value: number | null;
  label: string;
  icon: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const isWeight = metric === 'weight';
  const input = draft ?? (value === null ? '' : String(value).replace('.', ','));
  const dateLabel = capitalizeFirst(
    format(new Date(`${date}T00:00:00`), "EEEE d 'de' MMMM", { locale: es }),
  );
  const update = useMutation({
    mutationFn: (deleting: boolean) => {
      const current = { weight: null, steps: null, [metric]: value };
      const next = deleting
        ? { weight: null, steps: null }
        : parseTrackingInputs(isWeight ? input : '', isWeight ? '' : input);
      return applyTrackingChanges(api, date, current, next, (_, savedValue) => {
        queryClient.setQueryData<Map<string, number>>(['trackingWeeks', metric], (entries) => {
          const updated = new Map(entries);
          if (savedValue === null) updated.delete(date);
          else updated.set(date, savedValue);
          return updated;
        });
      });
    },
    onSuccess: async (_, deleting) => {
      await Promise.all(
        ['trackingWeeks', 'dashboard', 'weekSummaries', 'weights'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      );
      setDraft(null);
      toast.success(deleting ? 'Registro eliminado' : 'Registro guardado');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error && !isAxiosError(error)
          ? error.message
          : 'No se ha podido actualizar el registro. Vuelve a intentarlo.',
      );
    },
  });

  const removeEntry = async () => {
    if (
      await confirmAction({
        title: '¿Eliminar el registro?',
        description: `Se eliminará el registro de ${label.toLocaleLowerCase('es-ES')} de este día.`,
        confirmLabel: 'Eliminar',
        destructive: true,
      })
    )
      update.mutate(true);
  };

  return (
    <section className="card" aria-labelledby="tracking-metric-date">
      <h2 id="tracking-metric-date" className="mb-3 font-semibold" aria-live="polite">
        {dateLabel}
      </h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate(false);
        }}
      >
        <fieldset className="grid gap-3" disabled={update.isPending}>
          <label htmlFor="tracking-metric-value" className="flex items-center gap-2 font-semibold">
            {icon} {label}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="tracking-metric-value"
              className="form-input max-w-32"
              type="text"
              inputMode={isWeight ? 'decimal' : 'numeric'}
              value={input}
              onChange={(event) => setDraft(event.target.value)}
              required
            />
            <span className="text-sm text-[var(--text-secondary)]">
              {isWeight ? 'kg' : 'pasos'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary min-h-11">
              Guardar
            </button>
            {value !== null && (
              <button
                type="button"
                className="btn btn-danger min-h-11"
                onClick={() => void removeEntry()}
              >
                Borrar registro
              </button>
            )}
          </div>
        </fieldset>
      </form>
    </section>
  );
}
