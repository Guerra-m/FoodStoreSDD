/**
 * Componente Skeleton primitivo para loading states animados.
 *
 * @example
 * ```tsx
 * <Skeleton shape="rect" className="w-full h-32" />
 * <Skeleton shape="circle" size={40} />
 * <Skeleton shape="text" width="60%" />
 * ```
 */

type SkeletonShape = 'rect' | 'circle' | 'text';

interface SkeletonProps {
  shape?: SkeletonShape;
  width?: string | number;
  height?: string | number;
  size?: number;
  className?: string;
}

const shapeBorderRadius: Record<SkeletonShape, string> = {
  rect: '8px',
  circle: '50%',
  text: '4px',
};

export function Skeleton({
  shape = 'text',
  width,
  height,
  size,
  className = '',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    borderRadius: shapeBorderRadius[shape],
    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    backgroundColor: '#e5e7eb',
  };

  if (size) {
    style.width = size;
    style.height = size;
  } else {
    if (width) style.width = width;
    if (height) style.height = height;
  }
  if (shape === 'text' && !height) {
    style.height = 16;
  }

  return (
    <div
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}
