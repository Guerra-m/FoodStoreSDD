import { Skeleton } from './Skeleton';

/**
 * Skeleton para cards de producto en grids.
 * Muestra imagen 16:9, título, descripción y precio.
 */
export function SkeletonCard() {
  return (
    <div
      className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
      aria-busy="true"
      aria-label="Cargando producto"
    >
      {/* Imagen 16:9 */}
      <div className="w-full aspect-video">
        <Skeleton shape="rect" width="100%" height="100%" />
      </div>
      {/* Título */}
      <Skeleton width="60%" height={20} />
      {/* Descripción líneas */}
      <Skeleton width="100%" height={14} />
      <Skeleton width="80%" height={14} />
      {/* Precio */}
      <div className="mt-2">
        <Skeleton width="30%" height={24} />
      </div>
    </div>
  );
}
