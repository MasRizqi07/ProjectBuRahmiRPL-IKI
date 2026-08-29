"use client";

import { useEffect, useState } from "react";
import { BadgePercent, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { LoadingState } from "@/components/feedback/loading-state";
import { DesignBackdrop } from "@/components/ui/design-backdrop";
import { apiJson } from "@/lib/client/api";
import { formatIDR } from "@/lib/utils/format";

interface Promo {
  readonly code: string;
  readonly title: string;
  readonly discount_type: string;
  readonly discount_value: number;
  readonly max_discount: number | null;
  readonly minimum_spend: number;
  readonly remaining_quota: number;
  readonly ends_at: string;
}
interface Quote {
  readonly code: string;
  readonly discount: number;
  readonly totalAfterDiscount: number;
  readonly remainingQuota: number;
}
export default function PromosPage() {
  const [promos, setPromos] = useState<readonly Promo[] | null>(null);
  const [code, setCode] = useState("");
  const [subtotal, setSubtotal] = useState(500000);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void apiJson("/api/promos")
      .then((body) => setPromos((body as { promos: Promo[] }).promos))
      .catch((cause: unknown) =>
        setError(
          cause instanceof Error ? cause.message : "Promo gagal dimuat.",
        ),
      );
  }, []);
  const validate = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    try {
      setQuote(
        (await apiJson("/api/promos/validate", {
          method: "POST",
          body: JSON.stringify({ code, subtotal }),
        })) as Quote,
      );
      setError(null);
    } catch (cause) {
      setQuote(null);
      setError(cause instanceof Error ? cause.message : "Promo tidak valid.");
    }
  };
  return (
    <main id="main-content" className="container-shell space-y-8 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 p-8">
        <DesignBackdrop
        group="war_ticket_promos_exclusive_deals"
          index={0}
          imageClassName="opacity-30"
          overlayClassName="bg-black/80"
        />
        <div className="relative z-10">
          <span className="section-label">PROMO ENGINE</span>
          <h1 className="mt-2 font-display text-5xl">PROMOS & DEALS</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nilai, minimum spend, masa aktif, dan sisa quota diverifikasi ulang
            oleh server.
          </p>
        </div>
      </section>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      <form
        onSubmit={(event) => void validate(event)}
        className="grid gap-4 rounded-2xl border border-white/10 bg-[#141413] p-6 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="KODE PROMO"
          required
          className="rounded-xl border border-white/10 bg-black p-3 font-mono"
        />
        <input
          type="number"
          min={1}
          value={subtotal}
          onChange={(event) => setSubtotal(Number(event.target.value))}
          className="rounded-xl border border-white/10 bg-black p-3"
        />
        <Button>
          <Check />
          Validasi
        </Button>
      </form>
      {quote && (
        <InlineAlert variant="success">
          Diskon {formatIDR(quote.discount)} · Total{" "}
          {formatIDR(quote.totalAfterDiscount)} · Sisa quota{" "}
          {quote.remainingQuota}
        </InlineAlert>
      )}
      {!promos ? (
        <LoadingState label="Memuat promo aktif…" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promos.map((promo) => (
            <article
              key={promo.code}
              className="rounded-2xl border border-white/10 bg-[#141413] p-6"
            >
              <BadgePercent className="text-war-gold" />
              <h2 className="mt-3 font-display text-2xl">{promo.title}</h2>
              <p className="mt-2 font-mono text-war-gold">{promo.code}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Minimum {formatIDR(Number(promo.minimum_spend))} · quota tersisa{" "}
                {promo.remaining_quota} · hingga{" "}
                {new Date(promo.ends_at).toLocaleString("id-ID")}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  void navigator.clipboard.writeText(promo.code);
                  setCode(promo.code);
                  toast.success("Kode disalin");
                }}
              >
                <Copy />
                Salin & uji
              </Button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
