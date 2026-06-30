'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type TipoEvento = 'lancamento' | 'evento_ao_vivo' | 'subir_criativo' | 'aula_ao_vivo'

interface Evento {
  id: string
  titulo: string
  tipo: TipoEvento
  data: string
  descricao: string | null
}

interface Props {
  role: 'coprodutora' | 'cliente'
  userId: string
  eventos: Evento[]
}

const TIPO_META: Record<TipoEvento, { label: string; cor: string; bg: string }> = {
  lancamento:      { label: 'Lançamento',      cor: '#7C3AED', bg: '#EDE9FE' },
  evento_ao_vivo:  { label: 'Evento ao vivo',  cor: '#C4622D', bg: '#F0D4C0' },
  subir_criativo:  { label: 'Subir criativo',  cor: '#0369A1', bg: '#E0F2FE' },
  aula_ao_vivo:    { label: 'Aula ao vivo',    cor: '#6B7C4E', bg: '#D6E0C4' },
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const EMPTY_FORM = { titulo: '', tipo: 'lancamento' as TipoEvento, data: '', descricao: '' }

export default function CalendarioExpertClient({ role, userId, eventos: eventosIniciais }: Props) {
  const hoje = new Date()
  const supabase = createClient()

  const [eventos, setEventos] = useState(eventosIniciais)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [modalAberto, setModalAberto] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [toast, setToast] = useState('')

  function navMes(delta: number) {
    let m = mes + delta
    let a = ano
    if (m < 0) { m = 11; a-- }
    if (m > 11) { m = 0; a++ }
    setMes(m)
    setAno(a)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  async function salvarEvento(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) { setErro('O título é obrigatório.'); return }
    if (!form.data) { setErro('A data é obrigatória.'); return }
    setSalvando(true)
    setErro('')

    const { data, error } = await supabase.from('eventos').insert({
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      data: form.data,
      descricao: form.descricao.trim() || null,
      criado_por: userId,
    }).select().single()

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
      setSalvando(false)
      return
    }

    setEventos(prev => [...prev, data as Evento].sort((a, b) => a.data.localeCompare(b.data)))
    setModalAberto(false)
    setForm(EMPTY_FORM)
    setSalvando(false)
    showToast('Evento criado com sucesso!')
  }

  // Indexa eventos por data
  const eventosPorDia: Record<string, Evento[]> = {}
  for (const ev of eventos) {
    if (!eventosPorDia[ev.data]) eventosPorDia[ev.data] = []
    eventosPorDia[ev.data].push(ev)
  }

  const dias = new Date(ano, mes + 1, 0).getDate()
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const cells: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: dias }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const mesStr = String(mes + 1).padStart(2, '0')
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`

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
          <div className="w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Novo Evento</h2>
              <button onClick={() => setModalAberto(false)}
                className="text-[18px] leading-none opacity-50 hover:opacity-100"
                style={{ color: 'var(--text)' }}>×</button>
            </div>

            <form onSubmit={salvarEvento} className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Título *
                </label>
                <input type="text" value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#C4622D]"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="Nome do evento" autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Tipo *
                  </label>
                  <select value={form.tipo}
                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value as TipoEvento }))}
                    className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                    {Object.entries(TIPO_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Data *
                  </label>
                  <input type="date" value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Descrição
                </label>
                <textarea value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={2} className="w-full rounded-md px-3 py-2 text-[13px] outline-none resize-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="Detalhes opcionais..." />
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
                  {salvando ? 'Salvando…' : 'Criar evento'}
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
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Calendário do Expert</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Lançamentos, eventos ao vivo e marcos do Pai Rafa
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legenda */}
          <div className="hidden sm:flex items-center gap-3 flex-wrap">
            {Object.entries(TIPO_META).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.cor }} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{v.label}</span>
              </div>
            ))}
          </div>
          {role === 'coprodutora' && (
            <button onClick={() => { setForm(EMPTY_FORM); setErro(''); setModalAberto(true) }}
              className="flex items-center gap-1.5 rounded-lg px-4 py-[9px] text-[12.5px] font-semibold text-white"
              style={{ background: 'var(--terracota)' }}>
              <span className="text-[16px] leading-none">+</span> Novo Evento
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Navegação mês */}
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navMes(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[14px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            ‹
          </button>
          <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>
            {MESES[mes]} {ano}
          </span>
          <button onClick={() => navMes(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[14px]"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            ›
          </button>
          <button onClick={() => { setAno(hoje.getFullYear()); setMes(hoje.getMonth()) }}
            className="ml-1 px-3 py-1 rounded-lg text-[11.5px]"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Hoje
          </button>
        </div>

        {eventos.length === 0 && (
          <div className="rounded-xl p-10 text-center mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Nenhum evento cadastrado ainda.
              {role === 'coprodutora' && <><br />Clique em <strong>+ Novo Evento</strong> para adicionar.</>}
            </p>
          </div>
        )}

        {/* Grade calendário */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-7"
            style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold"
                style={{ color: 'var(--text-muted)' }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7" style={{ background: 'var(--bg)' }}>
            {cells.map((dia, i) => {
              if (!dia) return (
                <div key={`empty-${i}`} className="min-h-[88px] p-1"
                  style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', opacity: 0.3 }} />
              )
              const dataStr = `${ano}-${mesStr}-${String(dia).padStart(2, '0')}`
              const evsNoDia = eventosPorDia[dataStr] ?? []
              const isHoje = dataStr === hojeStr

              return (
                <div key={dataStr} className="min-h-[88px] p-1.5 flex flex-col gap-1"
                  style={{
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    background: isHoje ? 'var(--terracota-light)' : 'var(--surface)',
                  }}>
                  <span className="text-[11px] font-semibold self-end px-1 rounded"
                    style={{
                      background: isHoje ? 'var(--terracota)' : 'transparent',
                      color: isHoje ? 'white' : 'var(--text-muted)',
                    }}>
                    {dia}
                  </span>
                  {evsNoDia.slice(0, 3).map(ev => {
                    const meta = TIPO_META[ev.tipo]
                    return (
                      <div key={ev.id}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium truncate"
                        style={{ background: meta.bg, color: meta.cor }}>
                        {ev.titulo}
                      </div>
                    )
                  })}
                  {evsNoDia.length > 3 && (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      +{evsNoDia.length - 3} mais
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
