'use client'

import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'

export default function AlarmManager() {
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    let alarms: any[] = []
    const firedKeys = new Set<string>()
    let lastCheckedMinute = ''

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      const { data } = await supabase
        .from('user_sleep_alarms')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)

      alarms = data || []
    }

    init()

    const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

    const interval = setInterval(() => {
      if (Notification.permission !== 'granted' || alarms.length === 0) return

      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const currentMinute = `${hh}:${mm}`

      // Only check once per minute
      if (currentMinute === lastCheckedMinute) return
      lastCheckedMinute = currentMinute

      // Reset fired keys at midnight
      if (currentMinute === '00:00') firedKeys.clear()

      const currentDay = DAY_NAMES[now.getDay()]

      for (const alarm of alarms) {
        if (!alarm.enabled) continue
        if (!alarm.days?.includes(currentDay)) continue
        if (alarm.alarm_time !== currentMinute) continue

        const key = `${alarm.id}-${now.toDateString()}-${currentMinute}`
        if (firedKeys.has(key)) continue

        firedKeys.add(key)

        new Notification(alarm.label || 'Sleep Alarm', {
          body: `Time: ${currentMinute}`,
          icon: '/icon-192.png',
          tag: alarm.id,
        })
      }
    }, 10000)

    // Re-fetch alarms every 5 minutes to pick up any changes
    const refreshInterval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_sleep_alarms')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)
      alarms = data || []
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
      clearInterval(refreshInterval)
    }
  }, [supabase])

  return null
}
