export default function GaleriaLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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

      <div className="flex flex-col gap-8 px-10 py-8">
        {/* Hero skeleton */}
        <section className="overflow-hidden rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-[0_25px_70px_rgba(15,15,35,0.12)] animate-pulse">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="h-6 w-28 rounded-full bg-gray-200" />
              <div className="h-8 w-72 rounded bg-gray-200" />
              <div className="h-4 w-80 rounded bg-gray-200" />
            </div>
            <div className="flex gap-3">
              <div className="h-12 w-28 rounded-lg bg-gray-200" />
              <div className="h-12 w-12 rounded-lg bg-gray-200" />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="h-9 w-28 rounded-full bg-gray-200 animate-pulse" />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] animate-pulse"
            >
              <div className="h-40 w-full bg-gray-200" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-3 w-20 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
