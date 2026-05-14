import { Skeleton } from './Skeleton';

/**
 * Skeleton para cards de producto en grids.
 * Muestra imagen 16:9, título, descripción y precio.
 */
export function SkeletonCard() {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      aria-busy="true"
      aria-label="Cargando producto"
    >
      {/* Imagen 16:9 */}
      <div style={{ width: '100%', aspectRatio: '16 / 9' }}>
        <Skeleton shape="rect" width="100%" height="100%" />
      </div>
      {/* Título */}
      <Skeleton width="60%" height={20} />
      {/* Descripción líneas */}
      <Skeleton width="100%" height={14} />
      <Skeleton width="80%" height={14} />
      {/* Precio */}
      <div style={{ marginTop: '8px' }}>
        <Skeleton width="30%" height={24} />
      </div>
    </div>
  );
}
