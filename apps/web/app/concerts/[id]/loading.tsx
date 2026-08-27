export default function Loading() {
  return (
    <main id="main-content" className="flex-1" aria-busy="true">
      <section className="relative min-h-[620px] overflow-hidden bg-surface">
        <div className="absolute inset-0 animate-shimmer bg-linear-to-r from-surface via-surface-high to-surface bg-[length:200%_100%]" />
        <div className="container-shell relative flex min-h-[620px] items-end py-14">
          <div className="w-full max-w-3xl space-y-4"><div className="h-7 w-24 rounded-full bg-white/8" /><div className="h-20 w-4/5 rounded-xl bg-white/8 sm:h-28" /><div className="h-7 w-1/2 rounded-lg bg-white/8" /></div>
        </div>
      </section>
      <section className="container-shell grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div><div className="mb-6 h-12 w-64 rounded-lg bg-white/8" /><div className="grid gap-5 sm:grid-cols-2"><div className="h-80 rounded-2xl bg-white/5" /><div className="h-80 rounded-2xl bg-white/5" /></div></div>
        <div className="h-[430px] rounded-2xl bg-white/5" />
      </section>
    </main>
  )
}
