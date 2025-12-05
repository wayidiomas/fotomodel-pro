export default function DashboardLoading() {
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
        {/* Top cards skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-white bg-noise p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_18px_rgba(0,0,0,0.06)] animate-pulse"
            >
              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-lg bg-gray-200" />
                <div className="space-y-3">
                  <div className="h-6 w-32 rounded bg-gray-200" />
                  <div className="h-4 w-64 rounded bg-gray-200" />
                </div>
                <div className="h-10 w-36 rounded-md bg-gray-200" />
              </div>
              <div className="pointer-events-none absolute bottom-6 right-6 h-20 w-24 rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>

        {/* Carousels skeleton */}
        <div className="space-y-8">
          {["Últimas peças", "Últimas modelos", "Últimos downloads"].map((title, sectionIdx) => (
            <div key={sectionIdx} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] animate-pulse"
                  >
                    <div className="h-36 w-full bg-gray-200" />
                    <div className="space-y-2 p-3">
                      <div className="h-4 w-24 rounded bg-gray-200" />
                      <div className="h-3 w-16 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
