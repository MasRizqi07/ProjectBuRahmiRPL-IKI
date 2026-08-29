"use client";

import { useEffect, useState } from "react";
import { Armchair } from "lucide-react";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { LoadingState } from "@/components/feedback/loading-state";
import { apiJson } from "@/lib/client/api";

interface EventOption {
  readonly id: string;
  readonly title: string;
}
interface Section {
  readonly id: string;
  readonly name: string;
  readonly capacity: number;
  readonly sold: number;
  readonly held: number;
  readonly available: number;
}
export default function SeatingAnalyticsPage() {
  const [events, setEvents] = useState<readonly EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [sections, setSections] = useState<readonly Section[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void apiJson("/api/organizer/context")
      .then((body) => {
        const next = (body as { events: EventOption[] }).events;
        setEvents(next);
        setEventId(next[0]?.id ?? "");
      })
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Event gagal dimuat.",
        ),
      );
  }, []);
  useEffect(() => {
    if (!eventId) {
      setSections([]);
      return;
    }
    setSections(null);
    void apiJson(`/api/organizer/seating?eventId=${eventId}`)
      .then((body) => setSections((body as { sections: Section[] }).sections))
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Seating gagal dimuat.",
        ),
      );
  }, [eventId]);
  return (
    <main id="main-content" className="container-shell space-y-8 py-10">
      <header>
        <span className="section-label">VENUE INVENTORY</span>
        <h1 className="mt-2 font-display text-5xl">SEATING ANALYTICS</h1>
      </header>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      <select
        value={eventId}
        onChange={(event) => setEventId(event.target.value)}
        className="rounded-xl border border-white/10 bg-black p-3"
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title}
          </option>
        ))}
      </select>
      {sections === null ? (
        <LoadingState label="Menghitung seat inventory…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section.id}
              className="rounded-2xl border border-white/10 bg-[#141413] p-5"
            >
              <Armchair className="text-war-gold" />
              <h2 className="mt-3 font-display text-2xl">{section.name}</h2>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Kapasitas</dt>
                  <dd>{section.capacity}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Terjual</dt>
                  <dd>{section.sold}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Held</dt>
                  <dd>{section.held}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tersedia</dt>
                  <dd>{section.available}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
