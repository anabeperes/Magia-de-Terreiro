'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard',                    label: 'Visão Geral' },
  { href: '/dashboard/acoes',              label: 'Ações' },
  { href: '/dashboard/calendario-acoes',   label: 'Calendário de Ações' },
  { href: '/dashboard/calendario-expert',  label: 'Calendário do Expert' },
]

const NAV_CONFIG = [
  { href: '/dashboard/categorias', label: 'Categorias', roles: ['coprodutora'] as const },
]

interface Props {
  nome: string
  role: 'coprodutora' | 'cliente'
}

export default function Sidebar({ nome, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = nome
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="w-[210px] flex-shrink-0 flex flex-col py-5"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div
        className="px-4 pb-5 mb-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="text-[14px] font-bold" style={{ color: 'var(--terracota)' }}>
          Magia de Terreiro
        </div>
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Dashboard de Coprodução
        </div>
      </div>

      {/* Nav principal */}
      <nav className="flex-1">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-4 py-[9px] text-[12.5px] leading-snug transition-colors border-l-[3px]"
            style={{
              borderLeftColor: isActive(item.href) ? 'var(--terracota)' : 'transparent',
              background: isActive(item.href) ? 'var(--terracota-light)' : 'transparent',
              color: isActive(item.href) ? 'var(--terracota)' : 'var(--text-muted)',
              fontWeight: isActive(item.href) ? 600 : 400,
            }}
          >
            {item.label}
          </Link>
        ))}

        {/* Configurações — só coprodutora */}
        {role === 'coprodutora' && (
          <>
            <div
              className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-widest"
              style={{ color: 'var(--sand)' }}
            >
              Configurações
            </div>
            {NAV_CONFIG.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-[9px] text-[12.5px] transition-colors border-l-[3px]"
                style={{
                  borderLeftColor: isActive(item.href) ? 'var(--terracota)' : 'transparent',
                  background: isActive(item.href) ? 'var(--terracota-light)' : 'transparent',
                  color: isActive(item.href) ? 'var(--terracota)' : 'var(--text-muted)',
                  fontWeight: isActive(item.href) ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Usuário + logout */}
      <div
        className="px-4 pt-3"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: 'var(--terracota)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>
              {nome}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {role === 'coprodutora' ? 'Coprodutora' : 'Cliente'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full text-[11px] text-left transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
