export default function ModelosLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1728px] items-center justify-between px-6">
          <div className="h-6 w-28 rounded-md bg-gray-200 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-10 w-28 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1728px] space-y-10 px-7 py-10">
        <div className="space-y-3">
          <div className="h-8 w-60 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-80 rounded bg-gray-200 animate-pulse" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div key={idx} className="h-9 w-28 rounded-full bg-gray-200 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] animate-pulse"
            >
              <div className="h-52 w-full bg-gray-200" />
              <div className="space-y-2 p-4">
                <div className="h-5 w-32 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-12 rounded-full bg-gray-200" />
                  <div className="h-6 w-16 rounded-full bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
