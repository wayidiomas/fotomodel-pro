export default function CurtidasLoading() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at 12% 18%, rgba(214,192,150,0.14), transparent 32%), radial-gradient(circle at 85% 10%, rgba(190,170,130,0.12), transparent 32%), radial-gradient(circle at 30% 75%, rgba(200,180,140,0.1), transparent 38%)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />
          <div>
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-2xl bg-gray-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
