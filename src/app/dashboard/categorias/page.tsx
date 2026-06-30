import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CategoriasClient from './CategoriasClient'

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const role = (profileData as { role?: string } | null)?.role

  // Categorias só para coprodutora
  if (role !== 'coprodutora') redirect('/dashboard')

  const { data: categoriasData } = await supabase
    .from('categorias')
    .select('id, nome, cor, arquivada')
    .order('nome')

  return (
    <CategoriasClient
      userId={user.id}
      categorias={(categoriasData ?? []) as Array<{
        id: string
        nome: string
        cor: string | null
        arquivada: boolean
      }>}
    />
  )
}
