import Sidebar from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="student" />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
