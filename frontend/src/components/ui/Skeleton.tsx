export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="skeleton h-4 w-2/3 rounded-lg" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded-lg ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-4 rounded flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-white/5 flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`skeleton h-3 rounded flex-1 ${j === cols - 1 ? 'w-1/2 flex-none' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
