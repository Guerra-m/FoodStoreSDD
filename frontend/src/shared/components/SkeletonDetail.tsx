import { Skeleton } from './Skeleton';

/**
 * Skeleton para páginas de detalle (producto, orden, perfil).
 * Muestra imagen grande + varias líneas de texto.
 */
export function SkeletonDetail() {
  return (
    <div
      style={{
        maxWidth: '672px',
        margin: '0 auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
      aria-busy="true"
      aria-label="Cargando detalle"
      role="status"
    >
      {/* Imagen grande */}
      <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: '12px', overflow: 'hidden' }}>
        <Skeleton shape="rect" width="100%" height="100%" />
      </div>

      {/* Título */}
      <Skeleton width="50%" height={28} />

      {/* Líneas de descripción */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton width="100%" height={16} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="70%" height={16} />
      </div>

      {/* Precio */}
      <div style={{ marginTop: '8px' }}>
        <Skeleton width="25%" height={32} />
      </div>

      {/* Secciones adicionales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        <Skeleton width="35%" height={20} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} />
      </div>
    </div>
  );
}
