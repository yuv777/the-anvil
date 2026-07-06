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

// Schedules a daily repeating reminder at the given time.
// Fires every day at the same time-of-day without needing the app to be open.
export async function scheduleTaskReminder(remindAt: Date) {
  const plugin = await getPlugin()
  const REMINDER_ID = 9999

  if (!plugin) return

  await plugin.cancel({ notifications: [{ id: REMINDER_ID }] })

  await plugin.schedule({
    notifications: [{
      id: REMINDER_ID,
      title: 'The Anvil',
      body: "Don't break the streak — complete today's tasks",
      schedule: { at: remindAt, repeats: true, every: 'day', allowWhileIdle: true },
      sound: 'default',
    }],
  })
}
