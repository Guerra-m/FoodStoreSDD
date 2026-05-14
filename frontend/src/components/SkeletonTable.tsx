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
      style={{ width: '100%' }}
      aria-busy="true"
      aria-label="Cargando datos"
      role="status"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
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
          style={{
            display: 'flex',
            gap: '12px',
            padding: '12px 0',
            borderBottom: '1px solid #f3f4f6',
          }}
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
