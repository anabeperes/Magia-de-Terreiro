import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { nome: string; role: string } | null
  if (!profile) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar nome={profile.nome} role={profile.role as 'coprodutora' | 'cliente'} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
