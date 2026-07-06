import { Capacitor } from '@capacitor/core'

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

export async function cancelNotification(id: number) {
  const plugin = await getPlugin()
  if (!plugin) return
  await plugin.cancel({ notifications: [{ id }] })
}

export async function scheduleTaskReminder(remainingCount: number, remindAt: Date) {
  const plugin = await getPlugin()
  const REMINDER_ID = 9999

  if (!plugin) return

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
