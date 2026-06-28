'use client'

import { useState, useEffect } from 'react'

export const THEMES = [
  { id: 'obsidian',  name: 'Obsidian',  bg: '#080808', accent: '#22c55e' },
  { id: 'midnight',  name: 'Midnight',  bg: '#020b18', accent: '#60a5fa' },
  { id: 'ember',     name: 'Ember',     bg: '#0c0804', accent: '#fb923c' },
  { id: 'amethyst',  name: 'Amethyst',  bg: '#07050e', accent: '#c084fc' },
  { id: 'arctic',    name: 'Arctic',    bg: '#f2f2f5', accent: '#22c55e' },
] as const

export type ThemeId = typeof THEMES[number]['id']

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>('obsidian')

  useEffect(() => {
    // Read from DOM attribute first (set by anti-flash script), then localStorage
    const applied = document.documentElement.getAttribute('data-theme') as ThemeId
    const stored  = localStorage.getItem('anvil-theme') as ThemeId
    setTheme(applied || stored || 'obsidian')
  }, [])

  function changeTheme(id: ThemeId) {
    setTheme(id)
    localStorage.setItem('anvil-theme', id)
    document.documentElement.setAttribute('data-theme', id)
  }

  return { theme, changeTheme }
}
