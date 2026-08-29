"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Send, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { LoadingState } from "@/components/feedback/loading-state";
import { DesignBackdrop } from "@/components/ui/design-backdrop";
import { apiJson } from "@/lib/client/api";

interface Presale {
  readonly event_id: string;
  readonly title: string;
  readonly starts_at: string;
  readonly sales_open_at: string;
  readonly required_tier: string;
  readonly allocation: number;
}
interface ConciergeCase {
  readonly id: string;
  readonly subject: string;
  readonly status: string;
  readonly created_at: string;
}
interface EliteData {
  readonly membership: { tier: string; endsAt: string } | null;
  readonly presales: Presale[];
}
export default function EliteLoungePage() {
  const [elite, setElite] = useState<EliteData | null>(null);
  const [cases, setCases] = useState<readonly ConciergeCase[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (): Promise<void> => {
    try {
      const [presales, concierge] = await Promise.all([
        apiJson("/api/elite/presales"),
        apiJson("/api/elite/concierge"),
      ]);
      setElite(presales as EliteData);
      setCases((concierge as { cases: ConciergeCase[] }).cases);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Elite lounge gagal dimuat.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    try {
      await apiJson("/api/elite/concierge", {
        method: "POST",
        body: JSON.stringify({ subject, description }),
      });
      setSubject("");
      setDescription("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Concierge request gagal.",
      );
    }
  };
  return (
    <main id="main-content" className="container-shell space-y-8 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-war-gold/30 p-8">
        <DesignBackdrop
          group="war_ticket_elite_vanguard_lounge"
          index={0}
          imageClassName="opacity-30"
          overlayClassName="bg-black/80"
        />
        <div className="relative z-10">
          <Crown className="text-war-gold" />
          <h1 className="mt-3 font-display text-5xl">VANGUARD LOUNGE</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Presale menggunakan sales session dan queue terpisah; membership
            hanya memberi eligibility, bukan melewati fairness.
          </p>
        </div>
      </section>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      {!elite ? (
        <LoadingState label="Memverifikasi membership…" />
      ) : !elite.membership ? (
        <InlineAlert>
          Membership aktif tidak ditemukan. Pembelian tetap dinonaktifkan sampai
          billing provider dikonfigurasi.
        </InlineAlert>
      ) : (
        <>
          <InlineAlert variant="success">
            {elite.membership.tier} aktif hingga{" "}
            {new Date(elite.membership.endsAt).toLocaleDateString("id-ID")}.
          </InlineAlert>
          <section className="space-y-3">
            <h2 className="font-display text-3xl">Presale eligible</h2>
            {elite.presales.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-8">
                Belum ada presale.
              </p>
            ) : (
              elite.presales.map((presale) => (
                <article
                  key={presale.event_id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#141413] p-5"
                >
                  <div>
                    <span className="text-[10px] font-black text-war-gold">
                      {presale.required_tier} · alokasi {presale.allocation}
                    </span>
                    <h3 className="font-display text-2xl">{presale.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Sales{" "}
                      {new Date(presale.sales_open_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/waiting-room?eventId=${presale.event_id}`}>
                      <Ticket />
                      Masuk queue
                    </Link>
                  </Button>
                </article>
              ))
            )}
          </section>
          <section className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={(event) => void submit(event)}
              className="space-y-4 rounded-2xl border border-white/10 bg-[#141413] p-6"
            >
              <h2 className="font-display text-2xl">Concierge request</h2>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subjek"
                required
                minLength={3}
                className="w-full rounded-xl border border-white/10 bg-black p-3"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Kebutuhan Anda"
                required
                minLength={10}
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-black p-3"
              />
              <Button>
                <Send />
                Kirim
              </Button>
            </form>
            <div className="space-y-3">
              {cases.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#141413] p-5"
                >
                  <span className="text-[10px] text-war-gold">
                    {item.status}
                  </span>
                  <h3 className="font-display text-xl">{item.subject}</h3>
                  <time className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </time>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
