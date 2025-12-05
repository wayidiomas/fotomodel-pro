export default function HistoricoLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1728px] items-center justify-between px-6">
          <div className="h-6 w-28 rounded-md bg-gray-200 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-10 w-28 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1728px] px-7 py-10 space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="h-6 w-28 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-9 w-52 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-72 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-10 w-28 rounded-full bg-gray-200 animate-pulse" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_12px_45px_rgba(12,18,38,0.08)] animate-pulse"
            >
              <div className="h-52 w-full bg-gray-200" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-40 rounded bg-gray-200" />
                <div className="h-4 w-56 rounded bg-gray-200" />
                <div className="flex gap-2">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
