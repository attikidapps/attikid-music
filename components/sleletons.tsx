const Bone = ({ className = '' }: { className?: string }) => (
  <div className={`skeleton rounded ${className}`} />
);

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-2">
      <Bone className="w-10 h-10 shrink-0" />
      <div className="flex-1 space-y-2">
        <Bone className="h-3 w-1/3" />
        <Bone className="h-2 w-1/4" />
      </div>
      <Bone className="h-2 w-10" />
    </div>
  );
}

export function PlaylistCardSkeleton() {
  return (
    <div className="space-y-3">
      <Bone className="aspect-square w-full" />
      <Bone className="h-3 w-2/3" />
      <Bone className="h-2 w-1/2" />
    </div>
  );
}

export function NowPlayingSkeleton() {
  return (
    <div className="p-6 flex gap-6">
      <Bone className="w-64 h-64 rounded-md" />
      <div className="flex-1 space-y-3 pt-4">
        <Bone className="h-6 w-1/2" />
        <Bone className="h-4 w-1/3" />
      </div>
    </div>
  );
}
