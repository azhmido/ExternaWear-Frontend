const Skeleton = ({ className = '', variant = 'rect', width, height }) => {
  const base = 'animate-pulse bg-parchment/60 rounded-xl';
  const style = width || height ? { width, height } : {};
  return <div className={`${base} ${variant === 'circle' ? 'rounded-full' : ''} ${className}`} style={style} />;
};

export const SkeletonCard = () => (
  <div className="bg-ivory rounded-2xl overflow-hidden border border-parchment">
    <Skeleton className="w-full h-60 !rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);

export const SkeletonOrderItem = () => (
  <div className="border border-parchment rounded-2xl p-5 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton variant="circle" className="w-2 h-2" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    <Skeleton className="h-4 w-full" />
  </div>
);

export const SkeletonAddressItem = () => (
  <div className="border border-parchment rounded-2xl p-5 space-y-2">
    <div className="flex gap-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-12" />
    </div>
    <Skeleton className="h-4 w-40" />
    <Skeleton className="h-3 w-32" />
    <Skeleton className="h-3 w-48" />
  </div>
);

export const SkeletonProductDetail = () => (
  <div className="max-w-5xl mx-auto px-6 py-8">
    <Skeleton className="h-4 w-48 mb-8" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <Skeleton className="aspect-square !rounded-3xl" />
      <div className="space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
      </div>
    </div>
  </div>
);

export default Skeleton;