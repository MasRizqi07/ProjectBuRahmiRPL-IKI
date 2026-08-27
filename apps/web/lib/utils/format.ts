import type { TicketTier } from '../types/concert'

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string, locale?: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale || 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function getAvailabilityLabel(tier: TicketTier): string {
  const percent = getAvailabilityPercent(tier)
  if (percent === 0) return 'Habis'
  if (percent < 20) return 'Terbatas'
  return 'Tersedia'
}

export function getAvailabilityPercent(tier: TicketTier): number {
  if (tier.capacity === 0) return 0
  return Math.max(0, Math.min(100, ((tier.capacity - tier.sold) / tier.capacity) * 100))
}
