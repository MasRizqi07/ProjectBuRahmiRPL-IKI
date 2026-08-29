import { redirect } from 'next/navigation'

interface LegacyEdgeCheckoutProps {
  readonly searchParams: Promise<{ eventId?: string; tierId?: string }>
}

export default async function LegacyEdgeCheckout({ searchParams }: LegacyEdgeCheckoutProps) {
  const { eventId, tierId } = await searchParams
  const params = new URLSearchParams()
  if (eventId) params.set('eventId', eventId)
  if (tierId) params.set('tierId', tierId)
  redirect(params.size > 0 ? `/waiting-room?${params.toString()}` : '/concerts')
}
