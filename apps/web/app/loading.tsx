export default function RootLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-zinc-700/50 bg-zinc-950/80 p-8 shadow-xl shadow-black/20">
        <div className="h-4 w-48 rounded-full bg-zinc-700/70 animate-pulse" />
        <div className="h-4 w-32 rounded-full bg-zinc-700/70 animate-pulse" />
        <div className="h-4 w-40 rounded-full bg-zinc-700/70 animate-pulse" />
      </div>
    </main>
  )
}
