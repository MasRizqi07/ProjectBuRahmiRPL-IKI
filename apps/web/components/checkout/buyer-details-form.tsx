'use client'

import { CreditCard, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/forms/form-field'

export interface BuyerFormValues {
  readonly fullName: string
  readonly email: string
  readonly phone: string
  readonly nik: string
}

interface BuyerDetailsFormProps {
  readonly values: BuyerFormValues
  readonly nikConsent: boolean
  readonly submitting: boolean
  readonly expired: boolean
  readonly totalLabel: string
  readonly onChange: (field: keyof BuyerFormValues, value: string) => void
  readonly onConsentChange: (checked: boolean) => void
  readonly onSubmit: (event: React.FormEvent) => void
}

export function BuyerDetailsForm({ values, nikConsent, submitting, expired, totalLabel, onChange, onConsentChange, onSubmit }: BuyerDetailsFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="glass-panel rounded-2xl p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-war-gold/10 text-war-gold"><CreditCard className="size-5" /></div>
          <div><h2 className="font-display text-2xl tracking-wide">Data pembeli</h2><p className="text-xs text-muted-foreground">Pastikan data sesuai identitas.</p></div>
        </div>
        <div className="space-y-4">
          <FormField id="fullName" label="Nama lengkap" autoComplete="name" value={values.fullName} onChange={(event) => onChange('fullName', event.target.value)} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="email" label="Email" type="email" autoComplete="email" value={values.email} onChange={(event) => onChange('email', event.target.value)} required />
            <FormField id="phone" label="Nomor HP" type="tel" autoComplete="tel" placeholder="+628123456789" value={values.phone} onChange={(event) => onChange('phone', event.target.value)} required />
          </div>
          <FormField id="nik" label="NIK (opsional)" inputMode="numeric" maxLength={16} value={values.nik} onChange={(event) => onChange('nik', event.target.value.replace(/\D/g, ''))} hint="Hanya dibutuhkan untuk event dengan verifikasi identitas." />
          {values.nik && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-black/20 p-4 text-xs leading-5 text-muted-foreground">
              <input type="checkbox" checked={nikConsent} onChange={(event) => onConsentChange(event.target.checked)} className="mt-0.5 size-4 accent-primary" />
              Saya menyetujui penyimpanan NIK terenkripsi untuk verifikasi event ini.
            </label>
          )}
        </div>
      </section>
      <Button type="submit" size="lg" disabled={submitting || expired} className="h-14 w-full rounded-xl text-base font-bold"><LockKeyhole /> {submitting ? 'Membuka Midtrans…' : `Lanjutkan · ${totalLabel}`}</Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">Metode pembayaran dipilih di halaman aman Midtrans. War Ticket tidak menyimpan data kartu atau rekening.</p>
    </form>
  )
}
