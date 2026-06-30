'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-[360px] rounded-2xl p-9 shadow-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="text-center mb-8">
          <div
            className="text-xl font-extrabold mb-1"
            style={{ color: 'var(--terracota)' }}
          >
            Magia de Terreiro
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Dashboard de Coprodução
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#C4622D]"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md px-3 py-2 text-[13px] outline-none"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>

          {erro && (
            <p className="text-[12px] text-center" style={{ color: 'var(--terracota)' }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg py-[10px] text-[13px] font-semibold text-white mt-2 transition-opacity disabled:opacity-60"
            style={{ background: 'var(--terracota)' }}
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
