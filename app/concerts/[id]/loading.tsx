export default function ConcertDetailLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="h-80 rounded-4xl bg-zinc-900/60 animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded-full bg-zinc-900/60 animate-pulse" />
          <div className="flex flex-wrap gap-3">
            <div className="h-6 w-24 rounded-full bg-zinc-900/60 animate-pulse" />
            <div className="h-6 w-24 rounded-full bg-zinc-900/60 animate-pulse" />
            <div className="h-6 w-24 rounded-full bg-zinc-900/60 animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-52 rounded-3xl bg-zinc-900/60 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
