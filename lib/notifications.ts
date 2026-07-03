import { Capacitor } from '@capacitor/core'

// Dynamically import so the web build doesn't break
async function getPlugin() {
  if (!Capacitor.isNativePlatform()) return null
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  return LocalNotifications
}

export async function requestNotificationPermission(): Promise<boolean> {
  const plugin = await getPlugin()
  if (!plugin) {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      return result === 'granted'
    }
    return false
  }
  const { display } = await plugin.requestPermissions()
  return display === 'granted'
}

export async function scheduleAlarmNotification(opts: {
  id: number
  title: string
  body: string
  at: Date
  qrDismiss: boolean
}) {
  const plugin = await getPlugin()
  if (!plugin) return

  await plugin.schedule({
    notifications: [{
      id: opts.id,
      title: opts.title,
      body: opts.body,
      schedule: { at: opts.at, allowWhileIdle: true },
      sound: 'default',
      extra: { qrDismiss: opts.qrDismiss },
      actionTypeId: opts.qrDismiss ? 'QR_DISMISS' : '',
    }],
  })
}

export async function cancelNotification(id: number) {
  const plugin = await getPlugin()
  if (!plugin) return
  await plugin.cancel({ notifications: [{ id }] })
}

export async function cancelAllNotifications() {
  const plugin = await getPlugin()
  if (!plugin) return
  const pending = await plugin.getPending()
  if (pending.notifications.length > 0) {
    await plugin.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) })
  }
}

export async function scheduleTaskReminder(remainingCount: number, remindAt: Date) {
  const plugin = await getPlugin()
  const REMINDER_ID = 9999

  if (!plugin) return

  // Cancel existing reminder first
  await plugin.cancel({ notifications: [{ id: REMINDER_ID }] })

  if (remainingCount <= 0) return

  await plugin.schedule({
    notifications: [{
      id: REMINDER_ID,
      title: 'The Anvil',
      body: remainingCount === 1
        ? '1 task remaining — finish strong today'
        : `${remainingCount} tasks remaining — don't break the streak`,
      schedule: { at: remindAt, allowWhileIdle: true },
      sound: 'default',
    }],
  })
}

export async function setupNotificationListeners() {
  const plugin = await getPlugin()
  if (!plugin) return

  await plugin.addListener('localNotificationActionPerformed', (action) => {
    const extra = action.notification.extra as { qrDismiss?: boolean } | undefined
    if (extra?.qrDismiss) {
      window.location.href = '/alarm-dismiss'
    }
  })
}
