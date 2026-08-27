import { notFound } from 'next/navigation'

export default function AdminLayout(): never {
  // Organizer/admin product surfaces are intentionally deferred. Keeping the
  // old prototype reachable would expose misleading hardcoded operational data.
  notFound()
}
