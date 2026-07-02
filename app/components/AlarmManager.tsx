'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AlarmManager() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    let alarms: any[] = []
    const firedKeys = new Set<string>()
    let lastCheckedMinute = ''

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if ('Notification' in window && Notification.permission === 'default') {
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
      if (alarms.length === 0) return

      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const currentMinute = `${hh}:${mm}`

      if (currentMinute === lastCheckedMinute) return
      lastCheckedMinute = currentMinute

      if (currentMinute === '00:00') firedKeys.clear()

      const currentDay = DAY_NAMES[now.getDay()]

      for (const alarm of alarms) {
        if (!alarm.enabled) continue
        if (!alarm.days?.includes(currentDay)) continue
        if (alarm.alarm_time !== currentMinute) continue

        const key = `${alarm.id}-${now.toDateString()}-${currentMinute}`
        if (firedKeys.has(key)) continue
        firedKeys.add(key)

        if (alarm.qr_dismiss) {
          router.push('/alarm-dismiss')
        } else if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(alarm.label || 'Sleep Alarm', {
            body: `Time: ${currentMinute}`,
            icon: '/icon-192.png',
            tag: alarm.id,
          })
        }
      }
    }, 10000)

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
  }, [supabase, router])

  return null
}
