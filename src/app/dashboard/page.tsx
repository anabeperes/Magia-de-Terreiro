import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VisaoGeralClient from './VisaoGeralClient'

export default async function VisaoGeralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = ((profileData as { role?: string } | null)?.role ?? 'cliente') as 'coprodutora' | 'cliente'

  // Contagens por status
  const { data: acoesData } = await supabase
    .from('acoes')
    .select('id, status, categoria_id, titulo, data_prevista, visivel_para_cliente')

  const todas = (acoesData ?? []) as Array<{
    id: string
    status: string
    categoria_id: string | null
    titulo: string
    data_prevista: string | null
    visivel_para_cliente: boolean
  }>

  const counts = {
    planejada:    todas.filter(a => a.status === 'planejada').length,
    em_andamento: todas.filter(a => a.status === 'em_andamento').length,
    concluida:    todas.filter(a => a.status === 'concluida').length,
  }

  // Ações em aberto por categoria (planejada + em_andamento)
  const emAberto = todas.filter(a => a.status !== 'concluida')

  const porCategoria: Record<string, { count: number; acoes: typeof emAberto }> = {}
  for (const acao of emAberto) {
    const key = acao.categoria_id ?? '__sem_categoria__'
    if (!porCategoria[key]) porCategoria[key] = { count: 0, acoes: [] }
    porCategoria[key].count++
    porCategoria[key].acoes.push(acao)
  }

  // Busca nomes das categorias presentes
  const categoriaIds = Object.keys(porCategoria).filter(k => k !== '__sem_categoria__')
  const { data: categorias } = categoriaIds.length
    ? await supabase.from('categorias').select('id, nome, cor').in('id', categoriaIds)
    : { data: [] }

  return (
    <VisaoGeralClient
      role={role}
      counts={counts}
      porCategoria={porCategoria}
      categorias={categorias ?? []}
    />
  )
}
