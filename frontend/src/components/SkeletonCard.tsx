import { Skeleton } from './Skeleton';

/**
 * Skeleton para cards de producto en grids - diseño moderno.
 */
export function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-2xl border border-neutral-200/60 p-4 flex flex-col gap-4 animate-in"
      aria-busy="true"
      aria-label="Cargando producto"
    >
      {/* Imagen */}
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden">
        <Skeleton shape="rect" width="100%" height="100%" />
      </div>

      {/* Título */}
      <Skeleton width="70%" height={20} />

      {/* Descripción */}
      <div className="space-y-2">
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} />
      </div>

      {/* Precio y acción */}
      <div className="mt-2 flex items-center justify-between">
        <Skeleton width="25%" height={24} />
        <Skeleton width="30%" height={36} className="rounded-xl" />
      </div>
    </div>
  );
}