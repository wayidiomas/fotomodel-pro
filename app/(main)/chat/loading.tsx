export default function ChatLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <aside className="hidden w-72 flex-shrink-0 border-r border-gray-200 bg-white/70 px-4 py-6 backdrop-blur sm:block">
        <div className="mb-6 h-10 w-full rounded-lg bg-gray-200 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-12 w-full rounded-lg bg-gray-200 animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Chat area skeleton */}
      <main className="flex-1">
        <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white/70 px-6 backdrop-blur">
          <div className="h-6 w-40 rounded-md bg-gray-200 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 py-8">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-3">
              <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-gray-200 animate-pulse" />
                <div className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 bg-white/70 px-6 py-4 backdrop-blur">
          <div className="h-14 w-full rounded-2xl bg-gray-200 animate-pulse" />
          <div className="mt-3 flex items-center gap-3">
            <div className="h-4 w-16 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-14 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
