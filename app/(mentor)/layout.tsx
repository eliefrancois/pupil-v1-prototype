import Sidebar from '@/components/sidebar'

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="mentor" />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
