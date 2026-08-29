"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { LoadingState } from "@/components/feedback/loading-state";
import { apiJson } from "@/lib/client/api";
import { formatIDR } from "@/lib/utils/format";

interface Settlement {
  readonly id: string;
  readonly event_id: string;
  readonly gross_amount: number;
  readonly fees: number;
  readonly net_amount: number;
  readonly status: string;
  readonly payout_requested_at: string | null;
}
interface Context {
  readonly tenantId: string;
  readonly merchantEnabled: boolean;
}

export default function OrganizerWalletPage() {
  const [context, setContext] = useState<Context | null>(null);
  const [items, setItems] = useState<readonly Settlement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (): Promise<void> => {
    try {
      const next = (await apiJson("/api/organizer/context")) as Context;
      setContext(next);
      const response = (await apiJson(
        `/api/organizer/settlements?tenantId=${next.tenantId}`,
      )) as { settlements: Settlement[] };
      setItems(response.settlements);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Settlement gagal dimuat.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const payout = async (settlementId: string): Promise<void> => {
    if (!context) return;
    try {
      await apiJson("/api/organizer/settlements", {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ tenantId: context.tenantId, settlementId }),
      });
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Payout gagal diminta.",
      );
    }
  };
  return (
    <main
      id="main-content"
      className="container-shell max-w-4xl space-y-8 py-10"
    >
      <header>
        <span className="section-label">FINANCE</span>
        <h1 className="mt-2 font-display text-5xl">SETTLEMENT & PAYOUT</h1>
      </header>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      {!context || !items ? (
        <LoadingState label="Memuat settlement…" />
      ) : (
        <>
          {!context.merchantEnabled && (
            <InlineAlert>
              Payout dinonaktifkan sampai merchant tenant aktif.
            </InlineAlert>
          )}
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-8">
                Belum ada settlement.
              </p>
            ) : (
              items.map((item) => (
                <article
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#141413] p-5"
                >
                  <div>
                    <Wallet className="text-war-gold" />
                    <p className="mt-2 font-mono text-xs">{item.id}</p>
                    <p className="font-display text-2xl">
                      {formatIDR(Number(item.net_amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.status} · Fee {formatIDR(Number(item.fees))}
                    </p>
                  </div>
                  <Button
                    disabled={
                      !context.merchantEnabled || item.status !== "PAYABLE"
                    }
                    onClick={() => void payout(item.id)}
                  >
                    Minta payout
                  </Button>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}
