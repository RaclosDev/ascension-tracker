import { Skeleton } from '@/components/ui/skeleton';

export function ExercisesLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-end gap-3 -mb-2">
        <Skeleton className="h-8 w-24 rounded-md" />
      </header>

      <section className="card p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 flex-1 rounded-md" />
          </div>
        </div>

        <ul className="flex flex-col gap-1 p-0 m-0 list-none">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center gap-3 p-2 rounded-[10px]">
              <Skeleton className="h-10 w-10 rounded-md shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
