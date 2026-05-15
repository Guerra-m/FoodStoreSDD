type SkeletonShape = 'rect' | 'circle' | 'text';

interface SkeletonProps {
  shape?: SkeletonShape;
  width?: string | number;
  height?: string | number;
  size?: number;
  className?: string;
}

const shapeClass: Record<SkeletonShape, string> = {
  rect: 'rounded-lg',
  circle: 'rounded-full',
  text: 'rounded',
};

export function Skeleton({
  shape = 'text',
  width,
  height,
  size,
  className = '',
}: SkeletonProps) {
  const style: React.CSSProperties = {};

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
      className={`${className} ${shapeClass[shape]} bg-gray-200 animate-skeleton`}
      style={style}
      aria-hidden="true"
    />
  );
}
