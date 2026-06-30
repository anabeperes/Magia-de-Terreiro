import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarioExpertClient from './CalendarioExpertClient'

export default async function CalendarioExpertPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = ((profileData as { role?: string } | null)?.role ?? 'cliente') as 'coprodutora' | 'cliente'

  const { data: eventosData } = await supabase
    .from('eventos')
    .select('id, titulo, tipo, data, descricao')
    .order('data')

  return (
    <CalendarioExpertClient
      role={role}
      userId={user.id}
      eventos={(eventosData ?? []) as Array<{
        id: string
        titulo: string
        tipo: 'lancamento' | 'evento_ao_vivo' | 'subir_criativo' | 'aula_ao_vivo'
        data: string
        descricao: string | null
      }>}
    />
  )
}
