import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AcoesClient from './AcoesClient'

export default async function AcoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; categoria?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  const role = ((profileData as { role?: string; nome?: string } | null)?.role ?? 'cliente') as 'coprodutora' | 'cliente'

  const params = await searchParams
  const filtroStatus = params.status ?? ''
  const filtroCategoria = params.categoria ?? ''

  // Busca todas as ações (RLS cuida do que cliente pode ver)
  const { data: acoesData } = await supabase
    .from('acoes')
    .select('id, titulo, descricao, categoria_id, status, data_prevista, visivel_para_cliente, notas_internas, created_at, updated_at')
    .order('created_at', { ascending: false })

  // Busca categorias ativas
  const { data: categoriasData } = await supabase
    .from('categorias')
    .select('id, nome, cor')
    .eq('arquivada', false)
    .order('nome')

  return (
    <AcoesClient
      role={role}
      userId={user.id}
      acoes={(acoesData ?? []) as Array<{
        id: string
        titulo: string
        descricao: string | null
        categoria_id: string | null
        status: 'planejada' | 'em_andamento' | 'concluida'
        data_prevista: string | null
        visivel_para_cliente: boolean
        notas_internas: string | null
        created_at: string
        updated_at: string
      }>}
      categorias={(categoriasData ?? []) as Array<{ id: string; nome: string; cor: string | null }>}
      filtroStatusInicial={filtroStatus}
      filtroCategoriaInicial={filtroCategoria}
    />
  )
}
