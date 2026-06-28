'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, Users, User, BookOpen, Swords } from 'lucide-react'

const items = [
  { href: '/dashboard',  label: 'Today',      icon: Home },
  { href: '/challenges', label: 'Programs',   icon: Swords },
  { href: '/journal',    label: 'Journal',    icon: BookOpen },
  { href: '/analytics',  label: 'Analytics',  icon: BarChart2 },
  { href: '/squads',     label: 'Squads',     icon: Users },
  { href: '/profile',    label: 'Profile',    icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
    >
      <div className="flex justify-around items-center py-2 pb-safe max-w-xl mx-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors"
              style={{ color: active ? 'var(--green)' : 'var(--text-3)' }}
            >
              <Icon size={19} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
