'use client'

import Link from 'next/link'

interface Section {
  heading: string
  body: string | string[]
}

interface Props {
  title: string
  lastUpdated: string
  intro?: string
  sections: Section[]
}

export default function LegalPage({ title, lastUpdated, intro, sections }: Props) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="px-5 py-4 flex items-center justify-between max-w-2xl mx-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <span>⚒</span>
          <span className="text-xs font-black tracking-[0.15em] uppercase" style={{ color: 'var(--text)' }}>The Anvil</span>
        </Link>
        <Link href="/settings" className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>← Back</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-5 py-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Last updated: {lastUpdated}</p>
        <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--text)' }}>{title}</h1>

        {intro && (
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-2)' }}>{intro}</p>
        )}

        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={i}>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text)' }}>{s.heading}</h2>
              {Array.isArray(s.body) ? (
                <ul className="space-y-2">
                  {s.body.map((line, j) => (
                    <li key={j} className="text-sm leading-relaxed flex gap-2" style={{ color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--green)' }}>–</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.body}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            Questions? Contact us at{' '}
            <a href="mailto:support@theanvil.app" className="underline" style={{ color: 'var(--green)' }}>
              support@theanvil.app
            </a>
          </p>
          <div className="flex gap-4 mt-4 flex-wrap">
            {[['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies'], ['EULA', '/eula']].map(([label, href]) => (
              <Link key={href} href={href} className="text-xs underline" style={{ color: 'var(--text-3)' }}>{label}</Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
