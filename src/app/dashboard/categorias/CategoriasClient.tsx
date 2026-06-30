'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Categoria {
  id: string
  nome: string
  cor: string | null
  arquivada: boolean
}

interface Props {
  userId: string
  categorias: Categoria[]
}

const CORES_PRESET = [
  '#C4622D', '#6B7C4E', '#D4B896', '#9A8C78',
  '#7C3AED', '#0369A1', '#0891B2', '#B45309',
  '#BE185D', '#065F46', '#1D4ED8', '#374151',
]

const EMPTY_FORM = { nome: '', cor: '#C4622D' }

export default function CategoriasClient({ userId, categorias: initial }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [cats, setCats] = useState(initial)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [toast, setToast] = useState('')
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  function abrirNova() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setErro('')
    setModalAberto(true)
  }

  function abrirEdicao(cat: Categoria) {
    setEditando(cat)
    setForm({ nome: cat.nome, cor: cat.cor ?? '#C4622D' })
    setErro('')
    setModalAberto(true)
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setErro('O nome é obrigatório.'); return }
    setSalvando(true)
    setErro('')

    if (editando) {
      const { error } = await supabase
        .from('categorias')
        .update({ nome: form.nome.trim(), cor: form.cor } as never)
        .eq('id', editando.id)

      if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }
      setCats(prev => prev.map(c => c.id === editando.id ? { ...c, nome: form.nome.trim(), cor: form.cor } : c))
      showToast('Categoria atualizada!')
    } else {
      const { data, error } = await supabase
        .from('categorias')
        .insert({ nome: form.nome.trim(), cor: form.cor, criado_por: userId } as never)
        .select()
        .single()

      if (error) { setErro('Erro ao criar.'); setSalvando(false); return }
      setCats(prev => [...prev, data as Categoria].sort((a, b) => a.nome.localeCompare(b.nome)))
      showToast('Categoria criada!')
    }

    setSalvando(false)
    setModalAberto(false)
    router.refresh()
  }

  async function toggleArquivar(cat: Categoria) {
    const novo = !cat.arquivada
    const { error } = await supabase
      .from('categorias')
      .update({ arquivada: novo } as never)
      .eq('id', cat.id)

    if (!error) {
      setCats(prev => prev.map(c => c.id === cat.id ? { ...c, arquivada: novo } : c))
      showToast(novo ? 'Categoria arquivada.' : 'Categoria reativada.')
    }
  }

  const ativas = cats.filter(c => !c.arquivada)
  const arquivadas = cats.filter(c => c.arquivada)

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
          onClick={e => { if (e.target === e.currentTarget) setModalAberto(false) }}>
          <div className="w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>
                {editando ? 'Editar categoria' : 'Nova categoria'}
              </h2>
              <button onClick={() => setModalAberto(false)}
                className="text-[18px] leading-none opacity-50 hover:opacity-100"
                style={{ color: 'var(--text)' }}>×</button>
            </div>

            <form onSubmit={salvar} className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Nome *
                </label>
                <input type="text" value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#C4622D]"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="Nome da categoria" autoFocus />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {CORES_PRESET.map(cor => (
                    <button key={cor} type="button"
                      onClick={() => setForm(f => ({ ...f, cor }))}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: cor,
                        outline: form.cor === cor ? `3px solid ${cor}` : 'none',
                        outlineOffset: 2,
                      }} />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-6 h-6 rounded-full flex-shrink-0" style={{ background: form.cor }} />
                  <input type="color" value={form.cor}
                    onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer"
                    style={{ border: '1px solid var(--border)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Cor personalizada</span>
                </div>
              </div>

              {erro && <p className="text-[12px]" style={{ color: 'var(--terracota)' }}>{erro}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-lg text-[12.5px] font-semibold"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={salvando}
                  className="px-5 py-2 rounded-lg text-[12.5px] font-semibold text-white disabled:opacity-60"
                  style={{ background: 'var(--terracota)' }}>
                  {salvando ? 'Salvando…' : editando ? 'Salvar' : 'Criar'}
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
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Categorias</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {ativas.length} ativa{ativas.length !== 1 ? 's' : ''}{arquivadas.length > 0 ? ` · ${arquivadas.length} arquivada${arquivadas.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <button onClick={abrirNova}
          className="flex items-center gap-1.5 rounded-lg px-4 py-[9px] text-[12.5px] font-semibold text-white"
          style={{ background: 'var(--terracota)' }}>
          <span className="text-[16px] leading-none">+</span> Nova Categoria
        </button>
      </div>

      <div className="px-6 py-5">
        {ativas.length === 0 && arquivadas.length === 0 ? (
          <div className="rounded-xl p-12 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Nenhuma categoria cadastrada.<br />
              Clique em <strong>+ Nova Categoria</strong> para criar.
            </p>
          </div>
        ) : (
          <>
            {/* Lista ativas */}
            <div className="flex flex-col gap-2 mb-4">
              {ativas.map(cat => (
                <div key={cat.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: cat.cor ?? 'var(--border)' }} />
                  <span className="flex-1 text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                    {cat.nome}
                  </span>
                  <button onClick={() => abrirEdicao(cat)}
                    className="text-[12px] px-3 py-1 rounded-lg"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    Editar
                  </button>
                  <button onClick={() => toggleArquivar(cat)}
                    className="text-[12px] px-3 py-1 rounded-lg"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    Arquivar
                  </button>
                </div>
              ))}
            </div>

            {/* Arquivadas */}
            {arquivadas.length > 0 && (
              <>
                <button onClick={() => setMostrarArquivadas(v => !v)}
                  className="text-[12px] mb-3"
                  style={{ color: 'var(--text-muted)' }}>
                  {mostrarArquivadas ? '▾' : '▸'} {arquivadas.length} arquivada{arquivadas.length !== 1 ? 's' : ''}
                </button>
                {mostrarArquivadas && (
                  <div className="flex flex-col gap-2">
                    {arquivadas.map(cat => (
                      <div key={cat.id}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 opacity-60"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <span className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: cat.cor ?? 'var(--border)' }} />
                        <span className="flex-1 text-[13px]" style={{ color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {cat.nome}
                        </span>
                        <button onClick={() => toggleArquivar(cat)}
                          className="text-[12px] px-3 py-1 rounded-lg"
                          style={{ color: 'var(--olive)', border: '1px solid var(--olive-light)' }}>
                          Reativar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
