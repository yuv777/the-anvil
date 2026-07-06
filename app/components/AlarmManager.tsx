'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { scheduleAlarmNotification, setupNotificationListeners } from '@/lib/notifications'
import { Capacitor } from '@capacitor/core'

export default function AlarmManager() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    setupNotificationListeners()

    let alarms: any[] = []
    const firedKeys = new Set<string>()
    let lastCheckedMinute = ''

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Request permission
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications')
        await LocalNotifications.requestPermissions()
      } else if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

      const { data } = await supabase
        .from('user_sleep_alarms')
        .select('*')
        .eq('user_id', user.id)
        .eq('enabled', true)

      alarms = data || []

      // Schedule all enabled alarms as native local notifications
      if (Capacitor.isNativePlatform()) {
        await scheduleAllAlarms(alarms)
      }
    }

    init()

    const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

    // Web fallback: in-app alarm check (when app is open)
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

        // Always open the in-app alarm screen (beep + dismiss UI)
        router.push(alarm.qr_dismiss ? '/alarm-dismiss?qr=1' : '/alarm-dismiss')
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
      if (Capacitor.isNativePlatform()) {
        await scheduleAllAlarms(alarms)
      }
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
      clearInterval(refreshInterval)
    }
  }, [supabase, router])

  return null
}

async function scheduleAllAlarms(alarms: any[]) {
  const { LocalNotifications } = await import('@capacitor/local-notifications')

  // Clear all existing alarm notifications (IDs 1000-1999)
  const pending = await LocalNotifications.getPending()
  const alarmNotifs = pending.notifications.filter(n => n.id >= 1000 && n.id < 2000)
  if (alarmNotifs.length > 0) {
    await LocalNotifications.cancel({ notifications: alarmNotifs.map(n => ({ id: n.id })) })
  }

  const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const now = new Date()

  for (let i = 0; i < alarms.length; i++) {
    const alarm = alarms[i]
    if (!alarm.enabled || !alarm.days?.length) continue

    const [h, m] = alarm.alarm_time.split(':').map(Number)

    // Schedule next 7 occurrences (one per active day)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const target = new Date(now)
      target.setDate(target.getDate() + dayOffset)
      target.setHours(h, m, 0, 0)

      if (target <= now) continue

      const dayName = DAY_NAMES[target.getDay()]
      if (!alarm.days.includes(dayName)) continue

      await scheduleAlarmNotification({
        id: 1000 + i * 7 + dayOffset,
        title: alarm.label || 'The Anvil',
        body: alarm.qr_dismiss ? 'Scan your QR code to dismiss' : `Wake up — ${alarm.alarm_time}`,
        at: target,
        qrDismiss: alarm.qr_dismiss ?? false,
      })

      break // one upcoming notification per alarm is enough
    }
  }
}
