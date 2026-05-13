import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { getCurrentUser } from '@/lib/supabase/get-user'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <>
      <Navbar initialUser={user} />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
