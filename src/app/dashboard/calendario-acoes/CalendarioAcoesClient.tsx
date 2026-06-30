'use client'

import { useState } from 'react'

interface Acao {
  id: string
  titulo: string
  status: 'planejada' | 'em_andamento' | 'concluida'
  data_prevista: string
  categoria_id: string | null
}

interface Props {
  role: 'coprodutora' | 'cliente'
  acoes: Acao[]
}

const STATUS_META: Record<string, { label: string; cor: string; bg: string }> = {
  planejada:    { label: 'Planejada',    cor: 'var(--status-plan)',  bg: 'var(--status-plan-bg)' },
  em_andamento: { label: 'Em andamento', cor: 'var(--status-wip)',   bg: 'var(--status-wip-bg)' },
  concluida:    { label: 'Concluída',    cor: 'var(--status-done)',  bg: 'var(--status-done-bg)' },
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function getDiasNoMes(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getPrimeiroDia(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarioAcoesClient({ acoes }: Props) {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())

  function navMes(delta: number) {
    let m = mes + delta
    let a = ano
    if (m < 0) { m = 11; a-- }
    if (m > 11) { m = 0; a++ }
    setMes(m)
    setAno(a)
  }

  // Indexa ações por data (YYYY-MM-DD)
  const acoesPorDia: Record<string, Acao[]> = {}
  for (const a of acoes) {
    if (!acoesPorDia[a.data_prevista]) acoesPorDia[a.data_prevista] = []
    acoesPorDia[a.data_prevista].push(a)
  }

  const dias = getDiasNoMes(ano, mes)
  const primeiroDia = getPrimeiroDia(ano, mes)
  const cells: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: dias }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const mesStr = String(mes + 1).padStart(2, '0')
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`

  const temAcoes = acoes.length > 0

  return (
    <div>
      {/* Topbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-[14px]"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Calendário de Ações</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Ações com data prevista · coloridas por status
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legenda */}
          <div className="hidden sm:flex items-center gap-3">
            {Object.entries(STATUS_META).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.cor }} />
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{v.label}</span>
              </div>
            ))}
          </div>
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

        {!temAcoes && (
          <div className="rounded-xl p-10 text-center mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Nenhuma ação com data prevista cadastrada ainda.
              <br />Adicione datas nas ações para vê-las aqui.
            </p>
          </div>
        )}

        {/* Grade calendário */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Cabeçalho dias da semana */}
          <div className="grid grid-cols-7"
            style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold"
                style={{ color: 'var(--text-muted)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Células */}
          <div className="grid grid-cols-7" style={{ background: 'var(--bg)' }}>
            {cells.map((dia, i) => {
              if (!dia) return (
                <div key={`empty-${i}`} className="min-h-[88px] p-1"
                  style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', opacity: 0.3 }} />
              )
              const dataStr = `${ano}-${mesStr}-${String(dia).padStart(2, '0')}`
              const acoesNoDia = acoesPorDia[dataStr] ?? []
              const isHoje = dataStr === hojeStr

              return (
                <div key={dataStr} className="min-h-[88px] p-1.5 flex flex-col gap-1"
                  style={{
                    borderRight: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                    background: isHoje ? 'var(--terracota-light)' : 'var(--surface)',
                  }}>
                  <span className={`text-[11px] font-semibold self-end px-1 rounded ${isHoje ? 'text-white' : ''}`}
                    style={{ background: isHoje ? 'var(--terracota)' : 'transparent', color: isHoje ? undefined : 'var(--text-muted)' }}>
                    {dia}
                  </span>
                  {acoesNoDia.slice(0, 3).map(a => {
                    const st = STATUS_META[a.status]
                    return (
                      <div key={a.id}
                        className="rounded px-1.5 py-0.5 text-[10px] font-medium truncate"
                        style={{ background: st.bg, color: st.cor }}>
                        {a.titulo}
                      </div>
                    )
                  })}
                  {acoesNoDia.length > 3 && (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      +{acoesNoDia.length - 3} mais
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
