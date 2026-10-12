import { Skeleton } from '@/components/ui/skeleton';

export function DashboardChartsSkeleton() {
  return (
    <div
      className="charts-grid"
      role="status"
      aria-busy="true"
      aria-label="Cargando gráficos de evolución"
    >
      <span className="sr-only">Cargando gráficos de evolución...</span>
      {/* Weight Evolution Chart Skeleton */}
      <div className="chart-card full-width">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {/* Delta Chart Skeleton */}
      <div className="chart-card">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default DashboardChartsSkeleton;
