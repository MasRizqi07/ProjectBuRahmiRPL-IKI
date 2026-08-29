"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { LoadingState } from "@/components/feedback/loading-state";
import { apiJson } from "@/lib/client/api";
import { formatIDR } from "@/lib/utils/format";

interface Dispute {
  readonly id: string;
  readonly order_id: string;
  readonly reason: string;
  readonly status: string;
  readonly resolution: string | null;
  readonly created_at: string;
  readonly full_name: string | null;
  readonly total: number;
}
export default function AdminDisputesPage() {
  const [items, setItems] = useState<readonly Dispute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (): Promise<void> => {
    try {
      setItems(
        ((await apiJson("/api/admin/disputes")) as { disputes: Dispute[] })
          .disputes,
      );
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Disputes gagal dimuat.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const update = async (
    disputeId: string,
    status: "INVESTIGATING" | "REJECTED" | "RESOLVED",
  ): Promise<void> => {
    const resolution = window.prompt("Catatan resolusi");
    if (!resolution) return;
    try {
      await apiJson("/api/admin/disputes", {
        method: "PATCH",
        body: JSON.stringify({ disputeId, status, resolution }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Update gagal.");
    }
  };
  const refund = async (item: Dispute): Promise<void> => {
    const reason = window.prompt("Alasan refund provider");
    if (!reason) return;
    try {
      await apiJson(`/api/admin/disputes/${item.id}/refund`, {
        method: "POST",
        headers: { "idempotency-key": crypto.randomUUID() },
        body: JSON.stringify({ amount: Number(item.total), reason }),
      });
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Refund belum diterima provider.",
      );
    }
  };
  return (
    <main id="main-content" className="container-shell space-y-8 py-10">
      <header>
        <span className="section-label">SUPPORT OPERATIONS</span>
        <h1 className="mt-2 font-display text-5xl">DISPUTES & REFUNDS</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Refund hanya mengubah status lokal setelah pembayaran settlement dan
          respons Midtrans terverifikasi.
        </p>
      </header>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}
      {!items ? (
        <LoadingState label="Memuat dispute queue…" />
      ) : (
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 p-8">
              Tidak ada dispute.
            </p>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-[#141413] p-5"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <ShieldAlert className="text-war-gold" />
                    <span className="mt-2 block text-[10px] font-black text-war-gold">
                      {item.status}
                    </span>
                    <h2 className="font-display text-2xl">
                      Order {item.order_id}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.reason}
                    </p>
                    <p className="mt-2 text-xs">
                      {item.full_name ?? "Buyer"} ·{" "}
                      {formatIDR(Number(item.total))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => void update(item.id, "INVESTIGATING")}
                    >
                      Investigate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void update(item.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => void refund(item)}
                      disabled={item.status === "RESOLVED"}
                    >
                      <RotateCcw />
                      Full refund
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </main>
  );
}
