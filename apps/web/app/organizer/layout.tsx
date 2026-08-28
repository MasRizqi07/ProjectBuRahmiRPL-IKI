import { PortalSidebar } from '@/components/layout/portal-sidebar'

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))] bg-[#090909]">
      <PortalSidebar portalType="organizer" />
      <div className="flex-1 overflow-x-hidden p-4 sm:p-8 md:p-10">{children}</div>
    </div>
  )
}

