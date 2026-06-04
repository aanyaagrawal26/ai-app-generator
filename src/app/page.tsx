import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export default async function RootPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')
  return <LandingPage />
}
