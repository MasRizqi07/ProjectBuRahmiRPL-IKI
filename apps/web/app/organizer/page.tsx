"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarPlus,
  FileBarChart,
  Pause,
  Play,
  Radio,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { LoadingState } from "@/components/feedback/loading-state";
import { DesignBackdrop } from "@/components/ui/design-backdrop";
import { apiJson } from "@/lib/client/api";
import { formatIDR } from "@/lib/utils/format";

interface OrganizerContext {
  readonly tenantId: string;
  readonly role: string;
  readonly metrics: {
    events: number;
    paid_orders: number;
    revenue: number;
    active_sessions: number;
  };
  readonly merchantEnabled: boolean;
  readonly events: ReadonlyArray<{
    id: string;
    title: string;
    starts_at: string;
    approval_status: string;
    sales_session_id: string | null;
    sales_status: string | null;
  }>;
}

export default function OrganizerDashboardPage() {
  const [context, setContext] = useState<OrganizerContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (): Promise<void> => {
    try {
      setContext((await apiJson("/api/organizer/context")) as OrganizerContext);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Data organizer gagal dimuat.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const operate = async (
    eventId: string,
    payload: Readonly<Record<string, unknown>>,
  ): Promise<void> => {
    try {
      await apiJson(`/api/organizer/events/${eventId}/operations`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify(payload),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Operasi gagal.");
    }
  };

  return (
    <main id="main-content" className="container-shell space-y-8 py-8 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-8">
        <DesignBackdrop
          group="war_ticket_organizer_command_center"
          index={0}
          imageClassName="opacity-25"
          overlayClassName="bg-black/85"
        />
        <div className="relative z-10">
          <span className="section-label">PROMOTER COMMAND CENTER</span>
          <h1 className="mt-2 font-display text-5xl">OPERASI EVENT</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Semua angka berasal dari transaksi tenant dan setiap mutation
            dicatat di audit log.
          </p>
        </div>
      </section>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      {!context ? (
        <LoadingState label="Memuat telemetry organizer…" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Event", value: context.metrics.events },
              { label: "Order PAID", value: context.metrics.paid_orders },
              { label: "Revenue", value: formatIDR(context.metrics.revenue) },
              { label: "Sesi aktif", value: context.metrics.active_sessions },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/10 bg-[#141413] p-5"
              >
                <Activity className="size-4 text-war-gold" />
                <p className="mt-3 text-xs uppercase text-muted-foreground">
                  {metric.label}
                </p>
                <p className="font-display text-2xl">{metric.value}</p>
              </div>
            ))}
          </div>
          {!context.merchantEnabled && (
            <InlineAlert>
              Payout dan payment creation dinonaktifkan sampai merchant Midtrans
              tenant dikonfigurasi.
            </InlineAlert>
          )}
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/organizer/events/new">
                <CalendarPlus />
                Buat draft event
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/organizer/reports">
                <FileBarChart />
                Reports
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/organizer/wallet">
                <Wallet />
                Settlement
              </Link>
            </Button>
          </div>
          <section className="space-y-3">
            <h2 className="font-display text-3xl">Event tenant</h2>
            {context.events.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-8 text-sm text-muted-foreground">
                Belum ada event.
              </p>
            ) : (
              context.events.map((event) => (
                <article
                  key={event.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#141413] p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <span className="text-[10px] font-black text-war-gold">
                      {event.approval_status}
                    </span>
                    <h3 className="font-display text-2xl">{event.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.starts_at).toLocaleString("id-ID")} ·
                      Sales: {event.sales_status ?? "belum ada"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {event.sales_session_id &&
                      event.sales_status === "OPEN" && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            void operate(event.id, {
                              action: "PAUSE_SALES",
                              salesSessionId: event.sales_session_id,
                            })
                          }
                        >
                          <Pause />
                          Pause
                        </Button>
                      )}
                    {event.sales_session_id &&
                      event.sales_status === "PAUSED" && (
                        <Button
                          onClick={() =>
                            void operate(event.id, {
                              action: "RESUME_SALES",
                              salesSessionId: event.sales_session_id,
                            })
                          }
                        >
                          <Play />
                          Resume
                        </Button>
                      )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const message = window.prompt("Pesan broadcast");
                        if (message)
                          void operate(event.id, {
                            action: "BROADCAST",
                            message,
                          });
                      }}
                    >
                      <Radio />
                      Broadcast
                    </Button>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}
