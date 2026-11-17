import { Skeleton } from '../ui/skeleton';

/** Placeholder with the shape of a section, so the page does not jump when its content arrives. */
export function SectionSkeleton({ label = 'Cargando sección…' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3">
      <Skeleton className="h-16" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}
