import { Header } from '@/components/header'
import { HomePage } from '@/components/home-page'
import { getCurrentUser } from '@/lib/supabase/auth'
import categories from '@/data/categories.json'

export default async function Page() {
  const user = await getCurrentUser()

  return (
    <>
      <Header categories={categories} profile={user?.profile ?? null} />
      <HomePage />
    </>
  )
}

