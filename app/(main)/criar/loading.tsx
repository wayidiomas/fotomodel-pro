export default function CriarLoading() {
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

      <main className="mx-auto max-w-[1728px] px-7 py-10">
        <div className="mb-10 space-y-3">
          <div className="h-8 w-64 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-80 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Category cards skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] animate-pulse"
            >
              <div className="flex justify-between gap-4">
                <div className="space-y-3">
                  <div className="h-6 w-32 rounded bg-gray-200" />
                  <div className="h-4 w-44 rounded bg-gray-200" />
                  <div className="h-10 w-32 rounded-md bg-gray-200" />
                </div>
                <div className="relative h-40 w-36 rounded-xl bg-gray-100" />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-white/0 to-white/30" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
