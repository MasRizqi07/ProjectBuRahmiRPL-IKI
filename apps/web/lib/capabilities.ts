export type CapabilityStatus = 'enabled' | 'preview' | 'planned'

interface CapabilityDefinition {
  readonly status: CapabilityStatus
  readonly phase: number
  readonly message: string
}

export const capabilityRegistry = {
  adminAuditExport: {
    status: 'planned',
    phase: 6,
    message: 'Ekspor audit log menunggu integrasi data admin.',
  },
  adminDisputeResolution: {
    status: 'planned',
    phase: 6,
    message: 'Resolusi sengketa menunggu otorisasi dan audit trail server.',
  },
  adminEventModeration: {
    status: 'planned',
    phase: 6,
    message: 'Moderasi event menunggu endpoint admin yang terotorisasi.',
  },
  adminSecurityControls: {
    status: 'planned',
    phase: 6,
    message: 'Kontrol keamanan menunggu service admin dan audit trail.',
  },
  communityMessaging: {
    status: 'preview',
    phase: 7,
    message: 'Chat yang ditampilkan masih data preview dan belum terhubung ke layanan realtime.',
  },
  eliteMembershipPurchase: {
    status: 'planned',
    phase: 7,
    message: 'Pembelian membership belum terhubung ke billing.',
  },
  gateRedemption: {
    status: 'preview',
    phase: 6,
    message: 'Scanner saat ini hanya simulator UI dan belum meredeem tiket.',
  },
  newsletterSubscription: {
    status: 'planned',
    phase: 7,
    message: 'Pendaftaran notifikasi belum terhubung ke layanan pengiriman.',
  },
  organizerEventPublishing: {
    status: 'planned',
    phase: 5,
    message: 'Publikasi event menunggu penyimpanan database dan otorisasi organizer.',
  },
  organizerLiveOperations: {
    status: 'planned',
    phase: 5,
    message: 'Emergency operations menunggu command service dan audit trail.',
  },
  organizerPayout: {
    status: 'planned',
    phase: 5,
    message: 'Pencairan dana menunggu settlement service dan verifikasi rekening.',
  },
  organizerReportExport: {
    status: 'planned',
    phase: 5,
    message: 'Ekspor laporan menunggu sumber data transaksi yang tervalidasi.',
  },
  partnerApplication: {
    status: 'planned',
    phase: 7,
    message: 'Pengajuan partner belum terhubung ke workflow verifikasi.',
  },
  profilePersistence: {
    status: 'planned',
    phase: 2,
    message: 'Penyimpanan profil menunggu integrasi akun pengguna.',
  },
  ticketDocumentActions: {
    status: 'planned',
    phase: 4,
    message: 'Unduh dan bagikan tiket menunggu dokumen tiket resmi dari server.',
  },
} as const satisfies Record<string, CapabilityDefinition>

export type CapabilityName = keyof typeof capabilityRegistry

export function getCapability(name: CapabilityName): CapabilityDefinition {
  return capabilityRegistry[name]
}

export function isCapabilityEnabled(name: CapabilityName): boolean {
  return getCapability(name).status === 'enabled'
}
