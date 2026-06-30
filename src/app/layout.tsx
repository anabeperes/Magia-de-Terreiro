import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Magia de Terreiro — Dashboard de Coprodução',
  description: 'Dashboard de acompanhamento da coprodução Magia de Terreiro',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
