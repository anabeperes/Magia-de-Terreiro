'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Categoria {
  id: string
  nome: string
  cor: string | null
}

interface AcaoSimples {
  id: string
  titulo: string
  status: string
  categoria_id: string | null
  data_prevista: string | null
  visivel_para_cliente: boolean
}

interface Props {
  role: 'coprodutora' | 'cliente'
  counts: { planejada: number; em_andamento: number; concluida: number }
  porCategoria: Record<string, { count: number; acoes: AcaoSimples[] }>
  categorias: Categoria[]
}

const STATUS_LABEL: Record<string, string> = {
  planejada: 'Planejada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
}

function getWeekRange(weekValue: string) {
  const [year, weekStr] = weekValue.split('-W')
  const week = parseInt(weekStr)
  const jan4 = new Date(parseInt(year), 0, 4)
  const startW1 = new Date(jan4)
  startW1.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1)
  const seg = new Date(startW1)
  seg.setDate(startW1.getDate() + (week - 1) * 7)
  const dom = new Date(seg)
  dom.setDate(seg.getDate() + 6)
  return { seg, dom }
}

function fmtData(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentWeekValue() {
  const today = new Date()
  const y = today.getFullYear()
  const startOfYear = new Date(y, 0, 1)
  const weekNum = Math.ceil(((today.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${y}-W${String(weekNum).padStart(2, '0')}`
}

export default function VisaoGeralClient({ role, counts, porCategoria, categorias }: Props) {
  const router = useRouter()
  const [semana, setSemana] = useState(currentWeekValue)
  const [toastMsg, setToastMsg] = useState('')

  const catMap = Object.fromEntries(categorias.map(c => [c.id, c]))
  const totalAcoes = counts.planejada + counts.em_andamento + counts.concluida

  function navegarComFiltro(filtro: string, valor: string) {
    router.push(`/dashboard/acoes?${filtro}=${valor}`)
  }

  async function gerarRelatorio() {
    const { seg, dom } = getWeekRange(semana)
    const texto = [
      `Relatório semanal — ${fmtData(seg)} a ${fmtData(dom)}`,
      '',
      'Ações concluídas nesta semana:',
      'Nenhuma ação concluída nesta semana.',
      '',
      'Resumo geral:',
      `- Concluídas: ${counts.concluida}`,
      `- Em andamento: ${counts.em_andamento}`,
      `- Planejadas: ${counts.planejada}`,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = texto
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setToastMsg('✓ Texto copiado para o clipboard!')
    setTimeout(() => setToastMsg(''), 2800)
  }

  const catEntries = Object.entries(porCategoria).filter(([k]) => k !== '__sem_categoria__')
  const temCategorias = catEntries.length > 0

  return (
    <div>
      {/* Toast */}
      {toastMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-[10px] rounded-lg text-[13px] font-semibold text-white shadow-lg"
          style={{ background: '#2C2416' }}
        >
          {toastMsg}
        </div>
      )}

      {/* Topbar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-[14px]"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Visão Geral</h1>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Magia de Terreiro · Coprodução Ana &amp; Thaís
          </p>
        </div>
      </div>

      <div className="px-6 py-5">

        {/* Cards de status */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>Status das ações</h2>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {totalAcoes === 0 ? 'Nenhuma ação cadastrada' : 'Clique para ver a lista'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {([
            { key: 'planejada',    label: 'Planejadas',    sub: 'aguardando início',    cor: 'var(--status-plan)' },
            { key: 'em_andamento', label: 'Em Andamento',  sub: 'em execução agora',    cor: 'var(--terracota)' },
            { key: 'concluida',    label: 'Concluídas',    sub: 'entregues',             cor: 'var(--olive)' },
          ] as const).map(({ key, label, sub, cor }) => (
            <button
              key={key}
              onClick={() => navegarComFiltro('status', key)}
              className="text-left rounded-xl p-4 transition-all hover:-translate-y-0.5 group"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
                {label}
              </div>
              <div className="text-[26px] font-bold" style={{ color: cor }}>
                {counts[key]}
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>
              <div className="text-[10px] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--terracota)' }}>
                Ver ações →
              </div>
            </button>
          ))}
        </div>

        {/* Botão de relatório — só coprodutora */}
        {role === 'coprodutora' && (
          <div
            className="flex items-center gap-3 flex-wrap rounded-xl px-4 py-[14px] mb-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Relatório semanal
            </span>
            <input
              type="week"
              value={semana}
              onChange={e => setSemana(e.target.value)}
              className="rounded-md px-2.5 py-1.5 text-[12px] outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <div className="flex-1" />
            <button
              onClick={gerarRelatorio}
              className="rounded-lg px-3.5 py-[7px] text-[12px] font-semibold transition-opacity hover:opacity-85"
              style={{ background: 'var(--olive-light)', color: 'var(--olive)' }}
            >
              📋 Gerar Relatório
            </button>
          </div>
        )}

        {/* Ações por categoria */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
            Ações por categoria
            <span className="text-[10px] font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
              planejadas e em andamento · clique para ver
            </span>
          </h2>
        </div>

        {!temCategorias ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Nenhuma ação em aberto por enquanto.
              <br />
              Crie ações na aba <strong>Ações</strong> para vê-las aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {catEntries.map(([catId, { count }]) => {
              const cat = catMap[catId]
              if (!cat) return null
              return (
                <button
                  key={catId}
                  onClick={() => navegarComFiltro('categoria', catId)}
                  className="flex items-center gap-2.5 rounded-lg px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 group"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: cat.cor ?? 'var(--sand)' }}
                  />
                  <span className="text-[12.5px] font-semibold flex-1" style={{ color: 'var(--text)' }}>
                    {cat.nome}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {count}
                  </span>
                  <span className="text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--terracota)' }}>
                    →
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
