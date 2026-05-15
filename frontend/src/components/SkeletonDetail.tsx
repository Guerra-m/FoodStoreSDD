import { Skeleton } from './Skeleton';

/**
 * Skeleton para páginas de detalle (producto, orden, perfil).
 * Muestra imagen grande + varias líneas de texto.
 */
export function SkeletonDetail() {
  return (
    <div
      className="max-w-[672px] mx-auto p-6 flex flex-col gap-5"
      aria-busy="true"
      aria-label="Cargando detalle"
      role="status"
    >
      {/* Imagen grande */}
      <div className="w-full aspect-video rounded-xl overflow-hidden">
        <Skeleton shape="rect" width="100%" height="100%" />
      </div>

      {/* Título */}
      <Skeleton width="50%" height={28} />

      {/* Líneas de descripción */}
      <div className="flex flex-col gap-2">
        <Skeleton width="100%" height={16} />
        <Skeleton width="90%" height={16} />
        <Skeleton width="70%" height={16} />
      </div>

      {/* Precio */}
      <div className="mt-2">
        <Skeleton width="25%" height={32} />
      </div>

      {/* Secciones adicionales */}
      <div className="flex flex-col gap-3 mt-4">
        <Skeleton width="35%" height={20} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} />
      </div>
    </div>
  );
}
