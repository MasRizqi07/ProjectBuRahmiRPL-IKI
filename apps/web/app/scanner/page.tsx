"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { apiJson } from "@/lib/client/api";

interface Redemption {
  readonly ticketId: string;
  readonly status: string;
  readonly redeemedAt: string;
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const [token, setToken] = useState("");
  const [gate, setGate] = useState("MAIN-GATE");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Redemption | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => controlsRef.current?.stop(), []);

  const redeem = async (value: string): Promise<void> => {
    if (processingRef.current) return;
    processingRef.current = true;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const response = (await apiJson("/api/scanner/redeem", {
        method: "POST",
        body: JSON.stringify({ token: value, gate }),
      })) as Redemption;
      setResult(response);
      setToken("");
      controlsRef.current?.stop();
      setScanning(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tiket tidak valid.");
      controlsRef.current?.stop();
      setScanning(false);
    } finally {
      processingRef.current = false;
      setSubmitting(false);
    }
  };

  const startCamera = async (): Promise<void> => {
    setError(null);
    setResult(null);
    setScanning(true);
    try {
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current!,
        (scanResult) => {
          if (scanResult) void redeem(scanResult.getText());
        },
      );
    } catch (cause) {
      setScanning(false);
      setError(
        cause instanceof Error ? cause.message : "Kamera tidak tersedia.",
      );
    }
  };

  return (
    <main
      id="main-content"
      className="container-shell max-w-3xl space-y-8 py-8 sm:py-12"
    >
      <header>
        <span className="section-label">GATE OPERATIONS</span>
        <h1 className="mt-2 font-display text-5xl">ATOMIC QR SCANNER</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Satu QR hanya dapat diredeem sekali melalui transaksi row-lock
          PostgreSQL.
        </p>
      </header>
      {result && (
        <InlineAlert variant="success">
          <CheckCircle2 className="size-5" /> Tiket {result.ticketId} berhasil
          masuk pada {new Date(result.redeemedAt).toLocaleTimeString("id-ID")}.
        </InlineAlert>
      )}
      {error && (
        <InlineAlert variant="error">
          <XCircle className="size-5" />
          {error}
        </InlineAlert>
      )}
      <section className="space-y-5 rounded-3xl border border-white/10 bg-[#141413] p-6">
        <label className="block text-xs font-bold uppercase text-muted-foreground">
          Kode gate
          <input
            value={gate}
            onChange={(event) => setGate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-foreground"
          />
        </label>
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video
            ref={videoRef}
            muted
            playsInline
            className="size-full object-cover"
          />
          {!scanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ScanLine className="size-16 text-war-gold/50" />
            </div>
          )}
        </div>
        <Button
          onClick={() => void startCamera()}
          disabled={scanning || submitting}
          className="w-full"
        >
          <Camera />
          {scanning ? "Kamera aktif…" : "Aktifkan kamera QR"}
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-white/10" />
          fallback manual
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <textarea
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Tempel token QR untuk perangkat tanpa kamera"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs"
        />
        <Button
          variant="outline"
          onClick={() => void redeem(token)}
          disabled={token.length < 40 || submitting}
          className="w-full"
        >
          Validasi token
        </Button>
      </section>
    </main>
  );
}
