'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Categoria {
  id: string
  nome: string
  cor: string | null
}

interface Acao {
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
}

interface Props {
  role: 'coprodutora' | 'cliente'
  userId: string
  acoes: Acao[]
  categorias: Categoria[]
  filtroStatusInicial: string
  filtroCategoriaInicial: string
}

const STATUS_META: Record<string, { label: string; cor: string; bg: string }> = {
  planejada:    { label: 'Planejada',    cor: 'var(--status-plan)',  bg: 'var(--status-plan-bg)' },
  em_andamento: { label: 'Em andamento', cor: 'var(--status-wip)',   bg: 'var(--status-wip-bg)' },
  concluida:    { label: 'Concluída',    cor: 'var(--status-done)',  bg: 'var(--status-done-bg)' },
}

function fmtData(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const EMPTY_FORM = {
  titulo: '',
  descricao: '',
  categoria_id: '',
  status: 'planejada' as Acao['status'],
  data_prevista: '',
  visivel_para_cliente: false,
  notas_internas: '',
}

export default function AcoesClient({
  role, userId, acoes: acoesIniciais, categorias,
  filtroStatusInicial, filtroCategoriaInicial,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const supabase = createClient()

  const [acoes, setAcoes] = useState(acoesIniciais)
  const [filtroStatus, setFiltroStatus] = useState(filtroStatusInicial)
  const [filtroCategoria, setFiltroCategoria] = useState(filtroCategoriaInicial)
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [toast, setToast] = useState('')

  const catMap = useMemo(() => Object.fromEntries(categorias.map(c => [c.id, c])), [categorias])

  const acoesFiltradas = useMemo(() => {
    return acoes.filter(a => {
      if (filtroStatus && a.status !== filtroStatus) return false
      if (filtroCategoria && a.categoria_id !== filtroCategoria) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        if (!a.titulo.toLowerCase().includes(q) && !(a.descricao ?? '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [acoes, filtroStatus, filtroCategoria, busca])

  function abrirModal() {
    setForm(EMPTY_FORM)
    setErro('')
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setErro('')
  }

  async function salvarAcao(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) { setErro('O título é obrigatório.'); return }
    setSalvando(true)
    setErro('')

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      categoria_id: form.categoria_id || null,
      status: form.status,
      data_prevista: form.data_prevista || null,
      visivel_para_cliente: form.visivel_para_cliente,
      notas_internas: role === 'coprodutora' ? (form.notas_internas.trim() || null) : null,
      criado_por: userId,
    }

    const { data, error } = await supabase.from('acoes').insert(payload).select().single()

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
      setSalvando(false)
      return
    }

    setAcoes(prev => [data as Acao, ...prev])
    fecharModal()
    setSalvando(false)
    showToast('Ação criada com sucesso!')
    startTransition(() => router.refresh())
  }

  async function atualizarStatus(id: string, novoStatus: Acao['status']) {
    const { error } = await supabase.from('acoes').update({ status: novoStatus }).eq('id', id)
    if (!error) {
      setAcoes(prev => prev.map(a => a.id === id ? { ...a, status: novoStatus } : a))
      showToast('Status atualizado!')
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const limparFiltros = filtroStatus || filtroCategoria || busca.trim()

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-[10px] rounded-lg text-[13px] font-semibold text-white shadow-lg"
          style={{ background: '#2C2416' }}>
          {toast}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: 'rgba(44,36,22,0.45)' }}
          onClick={e => { if (e.target === e.currentTarget) fecharModal() }}>
          <div className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Nova Ação</h2>
              <button onClick={fecharModal} className="text-[18px] leading-none opacity-50 hover:opacity-100" style={{ color: 'var(--text)' }}>×</button>
            </div>

            <form onSubmit={salvarAcao} className="px-6 py-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
              {/* Título */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Título *
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#C4622D]"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="Nome da ação"
                  autoFocus
                />
              </div>

              {/* Descrição */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#C4622D] resize-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="O que será feito?"
                />
              </div>

              {/* Categoria + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Categoria
                  </label>
                  <select
                    value={form.categoria_id}
                    onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                    className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Acao['status'] }))}
                    className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  >
                    <option value="planejada">Planejada</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
              </div>

              {/* Data prevista */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Data prevista
                </label>
                <input
                  type="date"
                  value={form.data_prevista}
                  onChange={e => setForm(f => ({ ...f, data_prevista: e.target.value }))}
                  className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Visível para cliente */}
              {role === 'coprodutora' && (
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.visivel_para_cliente}
                    onChange={e => setForm(f => ({ ...f, visivel_para_cliente: e.target.checked }))}
                    className="w-4 h-4 accent-[#C4622D]"
                  />
                  <span className="text-[12.5px]" style={{ color: 'var(--text)' }}>
                    Visível para a Iza (cliente)
                  </span>
                </label>
              )}

              {/* Notas internas — só coprodutora */}
              {role === 'coprodutora' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Notas internas
                    <span className="ml-1 normal-case font-normal">(não visível para cliente)</span>
                  </label>
                  <textarea
                    value={form.notas_internas}
                    onChange={e => setForm(f => ({ ...f, notas_internas: e.target.value }))}
                    rows={2}
                    className="w-full rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#C4622D] resize-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    placeholder="Anotações internas, contexto, links..."
                  />
                </div>
              )}

              {erro && <p className="text-[12px]" style={{ color: 'var(--terracota)' }}>{erro}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={fecharModal}
                  className="px-4 py-2 rounded-lg text-[12.5px] font-semibold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="px-5 py-2 rounded-lg text-[12.5px] font-semibold text-white disabled:opacity-60"
                  style={{ background: 'var(--terracota)' }}>
                  {salvando ? 'Salvando…' : 'Criar ação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-[14px]"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Ações</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {acoesFiltradas.length} ação{acoesFiltradas.length !== 1 ? 'ões' : ''} encontrada{acoesFiltradas.length !== 1 ? 's' : ''}
          </p>
        </div>
        {role === 'coprodutora' && (
          <button onClick={abrirModal}
            className="flex items-center gap-1.5 rounded-lg px-4 py-[9px] text-[12.5px] font-semibold text-white"
            style={{ background: 'var(--terracota)' }}>
            <span className="text-[16px] leading-none">+</span> Nova Ação
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar ações..."
            className="rounded-md px-3 py-[7px] text-[12.5px] outline-none focus:ring-2 focus:ring-[#C4622D]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', minWidth: 180 }}
          />
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="rounded-md px-3 py-[7px] text-[12.5px] outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="">Todos os status</option>
            <option value="planejada">Planejada</option>
            <option value="em_andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
          </select>
          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className="rounded-md px-3 py-[7px] text-[12.5px] outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="">Todas as categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {limparFiltros && (
            <button
              onClick={() => { setFiltroStatus(''); setFiltroCategoria(''); setBusca('') }}
              className="rounded-md px-3 py-[7px] text-[12px]"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Limpar filtros ×
            </button>
          )}
        </div>

        {/* Lista de ações */}
        {acoesFiltradas.length === 0 ? (
          <div className="rounded-xl p-12 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {acoes.length === 0
                ? <>Nenhuma ação cadastrada ainda.{role === 'coprodutora' && <><br />Clique em <strong>+ Nova Ação</strong> para começar.</>}</>
                : 'Nenhuma ação encontrada com os filtros aplicados.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {acoesFiltradas.map(acao => {
              const cat = acao.categoria_id ? catMap[acao.categoria_id] : null
              const st = STATUS_META[acao.status]
              return (
                <div key={acao.id}
                  className="rounded-xl px-4 py-3.5 flex items-start gap-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {/* Bolinha de cor da categoria */}
                  <div className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: cat?.cor ?? 'var(--border)' }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13.5px] font-semibold" style={{ color: 'var(--text)' }}>
                        {acao.titulo}
                      </span>
                      {!acao.visivel_para_cliente && role === 'coprodutora' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--terracota-light)', color: 'var(--terracota)' }}>
                          interno
                        </span>
                      )}
                    </div>
                    {acao.descricao && (
                      <p className="text-[12px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                        {acao.descricao}
                      </p>
                    )}
                    <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                      {cat && (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {cat.nome}
                        </span>
                      )}
                      {acao.data_prevista && (
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          · {fmtData(acao.data_prevista)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge de status + troca rápida (só coprodutora) */}
                  {role === 'coprodutora' ? (
                    <select
                      value={acao.status}
                      onChange={e => atualizarStatus(acao.id, e.target.value as Acao['status'])}
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold outline-none cursor-pointer"
                      style={{ background: st.bg, color: st.cor, border: 'none' }}
                    >
                      <option value="planejada">Planejada</option>
                      <option value="em_andamento">Em andamento</option>
                      <option value="concluida">Concluída</option>
                    </select>
                  ) : (
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold flex-shrink-0"
                      style={{ background: st.bg, color: st.cor }}>
                      {st.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
