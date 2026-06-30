import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarioAcoesClient from './CalendarioAcoesClient'

export default async function CalendarioAcoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = ((profileData as { role?: string } | null)?.role ?? 'cliente') as 'coprodutora' | 'cliente'

  // Só ações com data_prevista
  const { data: acoesData } = await supabase
    .from('acoes')
    .select('id, titulo, status, data_prevista, categoria_id')
    .not('data_prevista', 'is', null)
    .order('data_prevista')

  return (
    <CalendarioAcoesClient
      role={role}
      acoes={(acoesData ?? []) as Array<{
        id: string
        titulo: string
        status: 'planejada' | 'em_andamento' | 'concluida'
        data_prevista: string
        categoria_id: string | null
      }>}
    />
  )
}
