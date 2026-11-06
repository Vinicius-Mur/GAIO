import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={clsx('animate-pulse rounded-xl bg-surface-100', className)} />
);
