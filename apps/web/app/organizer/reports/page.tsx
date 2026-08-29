"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { LoadingState } from "@/components/feedback/loading-state";
import { apiJson } from "@/lib/client/api";

interface Context {
  readonly tenantId: string;
  readonly metrics: { events: number; paid_orders: number; revenue: number };
  readonly events: ReadonlyArray<{ id: string; title: string }>;
}
export default function OrganizerReportsPage() {
  const [context, setContext] = useState<Context | null>(null);
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void apiJson("/api/organizer/context")
      .then((body) => {
        if (!cancelled) setContext(body as Context);
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(
            cause instanceof Error ? cause.message : "Report gagal dimuat.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const href = (format: "csv" | "pdf"): string =>
    context
      ? `/api/organizer/reports/sales?tenantId=${context.tenantId}&format=${format}${eventId ? `&eventId=${eventId}` : ""}`
      : "#";
  return (
    <main
      id="main-content"
      className="container-shell max-w-4xl space-y-8 py-10"
    >
      <header>
        <span className="section-label">FINANCE EXPORT</span>
        <h1 className="mt-2 font-display text-5xl">SALES REPORT</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ekspor dihasilkan dari order tenant dengan authorization server-side.
        </p>
      </header>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      {!context ? (
        <LoadingState label="Memuat data report…" />
      ) : (
        <section className="space-y-6 rounded-3xl border border-white/10 bg-[#141413] p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <p>
              Event
              <br />
              <strong className="font-display text-3xl">
                {context.metrics.events}
              </strong>
            </p>
            <p>
              Order PAID
              <br />
              <strong className="font-display text-3xl">
                {context.metrics.paid_orders}
              </strong>
            </p>
            <p>
              Revenue
              <br />
              <strong className="font-display text-3xl">
                IDR {context.metrics.revenue}
              </strong>
            </p>
          </div>
          <label className="block text-xs font-bold uppercase text-muted-foreground">
            Filter event
            <select
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black p-3 text-foreground"
            >
              <option value="">Semua event</option>
              {context.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-3">
            <Button asChild>
              <a href={href("csv")}>
                <Sheet />
                <Download />
                CSV
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={href("pdf")}>
                <FileText />
                <Download />
                PDF
              </a>
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
