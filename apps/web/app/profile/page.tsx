'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  KeyRound,
  Lock,
  LogOut,
  Save,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { InlineAlert } from '@/components/feedback/inline-alert'
import { LoadingState } from '@/components/feedback/loading-state'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { apiJson } from '@/lib/client/api'

interface ProfileForm {
  email: string
  fullName: string
  phone: string
  emailNotifications: boolean
  whatsappNotifications: boolean
}

const emptyProfile: ProfileForm = {
  email: '',
  fullName: '',
  phone: '',
  emailNotifications: true,
  whatsappNotifications: false,
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<ProfileForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void apiJson('/api/me/profile')
      .then((body) => {
        if (!cancelled) setProfile(body as ProfileForm)
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Profil gagal dimuat.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const update = <K extends keyof ProfileForm>(
    key: K,
    value: ProfileForm[K],
  ): void => {
    setProfile((current) => ({ ...(current ?? emptyProfile), [key]: value }))
  }

  const submitProfile = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    setError(null)
    try {
      await apiJson('/api/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone,
          emailNotifications: profile.emailNotifications,
          whatsappNotifications: profile.whatsappNotifications,
        }),
      })
      toast.success('Profil dan preferensi berhasil disimpan.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Profil gagal disimpan.')
    } finally {
      setSaving(false)
    }
  }

  const submitChangePassword = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }

    setPasswordSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (authError) throw authError

      toast.success('Password berhasil diperbarui.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : 'Gagal memperbarui password.'
      toast.error(msg)
      setError(msg)
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSignOutOtherSessions = async (): Promise<void> => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: 'others' })
      toast.success('Berhasil keluar dari semua sesi perangkat lain.')
    } catch {
      toast.error('Gagal memproses pengeluaran sesi.')
    }
  }

  return (
    <main id="main-content" className="container-shell max-w-4xl space-y-8 py-8 sm:py-12">
      <header className="border-b border-white/10 pb-6">
        <span className="section-label">PENGATURAN AKUN</span>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">PROFIL & KEAMANAN</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola identitas akun, preferensi notifikasi, dan kontrol keamanan akses sesi Anda.
        </p>
      </header>

      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {!profile ? (
        <LoadingState label="Memuat profil pengguna…" />
      ) : (
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="w-full justify-start sm:w-auto">
            <TabsTrigger value="profile" className="gap-2">
              <User className="size-4" /> Profil & Preferensi
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <KeyRound className="size-4" /> Keamanan & Akses
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PROFIL */}
          <TabsContent value="profile" className="space-y-6">
            <form onSubmit={(e) => void submitProfile(e)} className="space-y-6">
              <section className="glass-panel space-y-6 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                  <User className="size-5 text-war-gold" />
                  <h2 className="font-display text-2xl">Identitas Pengguna</h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nama Lengkap
                    <input
                      value={profile.fullName}
                      onChange={(event) => update('fullName', event.target.value)}
                      placeholder="Nama lengkap sesuai KTP"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-foreground focus:border-war-gold focus:outline-none"
                      required
                    />
                  </label>

                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nomor WhatsApp
                    <input
                      value={profile.phone}
                      onChange={(event) => update('phone', event.target.value)}
                      placeholder="08123456789"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-foreground focus:border-war-gold focus:outline-none"
                      required
                    />
                  </label>

                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground sm:col-span-2">
                    Email Akun Terdaftar
                    <input
                      value={profile.email}
                      readOnly
                      className="mt-2 w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-muted-foreground focus:outline-none"
                    />
                  </label>
                </div>
              </section>

              <section className="glass-panel space-y-5 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                  <Bell className="size-5 text-war-gold" />
                  <h2 className="font-display text-2xl">Saluran Notifikasi War</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Email Konfirmasi & Tiket</p>
                      <p className="text-xs text-muted-foreground">
                        Terima invoice dan token QR tiket instan via email.
                      </p>
                    </div>
                    <Switch
                      checked={profile.emailNotifications}
                      onCheckedChange={(checked) => update('emailNotifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">WhatsApp Sinyal Antrean</p>
                      <p className="text-xs text-muted-foreground">
                        Pemberitahuan darurat saat nomor antrean Anda mendekati giliran pembayaran.
                      </p>
                    </div>
                    <Switch
                      checked={profile.whatsappNotifications}
                      onCheckedChange={(checked) => update('whatsappNotifications', checked)}
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={saving}
                  className="gap-2 rounded-xl px-8 font-bold"
                >
                  <Save className="size-4" />
                  {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: KEAMANAN */}
          <TabsContent value="security" className="space-y-6">
            {/* Account Status Card */}
            <section className="glass-panel flex flex-col justify-between gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-status-success/30 bg-status-success/10 text-status-success">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground">Akun Terverifikasi</h3>
                  <p className="text-xs text-status-success font-semibold">Tingkat Keamanan Sesi: Maksimum</p>
                </div>
              </div>
              <span className="rounded-full border border-status-success/30 bg-status-success/10 px-3.5 py-1 text-xs font-bold text-status-success uppercase">
                Aktif
              </span>
            </section>

            {/* Change Password */}
            <section className="glass-panel space-y-6 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                <Lock className="size-5 text-war-gold" />
                <h2 className="font-display text-2xl">Ubah Kata Sandi</h2>
              </div>

              <form onSubmit={(e) => void submitChangePassword(e)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground sm:col-span-2">
                    Password Baru
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-foreground focus:border-war-gold focus:outline-none"
                      required
                    />
                  </label>

                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground sm:col-span-2">
                    Konfirmasi Password Baru
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-foreground focus:border-war-gold focus:outline-none"
                      required
                    />
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={passwordSaving}
                  className="rounded-xl font-bold"
                >
                  {passwordSaving ? 'Memproses…' : 'Perbarui Kata Sandi'}
                </Button>
              </form>
            </section>

            {/* 2FA Section - Honest Coming Soon State */}
            <section className="glass-panel space-y-4 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-5 text-tertiary-container" />
                  <h2 className="font-display text-2xl">Autentikasi Dua Faktor (2FA)</h2>
                </div>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                  Segera Hadir
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Dukungan aplikasi autentikator (Google Authenticator / 1Password) dan verifikasi SMS sedang disiapkan untuk pengamanan tingkat tinggi tiket Anda.
              </p>

              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <KeyRound className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Aplikasi Autentikator</p>
                    <p className="text-[11px] text-muted-foreground">Gunakan kode OTP 6-digit</p>
                  </div>
                </div>
                <Switch disabled checked={false} />
              </div>
            </section>

            {/* Active Sessions */}
            <section className="glass-panel space-y-4 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                <ShieldAlert className="size-5 text-destructive" />
                <h2 className="font-display text-2xl">Sesi & Keamanan Perangkat</h2>
              </div>

              <p className="text-xs text-muted-foreground">
                Jika Anda mencurigai adanya aktivitas login yang tidak wajar, Anda dapat membatalkan semua sesi login di perangkat lain secara instan.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSignOutOtherSessions()}
                className="gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Keluar dari Semua Sesi Lain
              </Button>
            </section>
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}
