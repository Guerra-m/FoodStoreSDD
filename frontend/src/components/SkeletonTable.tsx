import { Skeleton } from './Skeleton';

interface ColumnConfig {
  width: string;
  header?: string;
}

interface SkeletonTableProps {
  rows?: number;
  columns?: ColumnConfig[];
}

const defaultColumns: ColumnConfig[] = [
  { width: '10%' },
  { width: '25%' },
  { width: '15%' },
  { width: '15%' },
  { width: '10%' },
  { width: '15%' },
  { width: '10%' },
];

/**
 * Skeleton para tablas con filas animadas.
 * Útil para admin pages y listas.
 */
export function SkeletonTable({
  rows = 5,
  columns = defaultColumns,
}: SkeletonTableProps) {
  return (
    <div
      className="w-full"
      aria-busy="true"
      aria-label="Cargando datos"
      role="status"
    >
      {/* Header */}
      <div className="flex gap-3 mb-3 pb-2 border-b border-gray-200">
        {columns.map((col, i) => (
          <div key={i} style={{ width: col.width }}>
            <Skeleton width="100%" height={16} />
          </div>
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-3 py-3 border-b border-gray-100"
        >
          {columns.map((col, colIdx) => (
            <div key={colIdx} style={{ width: col.width }}>
              <Skeleton width="100%" height={14} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
