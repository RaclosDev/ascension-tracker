import { Skeleton } from '@/components/ui/skeleton';

export function WorkoutPageSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 py-4"
      role="status"
      aria-busy="true"
      aria-label="Cargando catálogo de entrenamiento"
    >
      <span className="sr-only">Cargando catálogo de entrenamiento...</span>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-36 w-full rounded-2xl" />
    </div>
  );
}

export default WorkoutPageSkeleton;
