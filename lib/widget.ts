import { registerPlugin } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'

interface WidgetPlugin {
  updateTasks(options: { completed: number; total: number }): Promise<void>
}

const WidgetBridge = registerPlugin<WidgetPlugin>('Widget')

export async function updateWidget(completed: number, total: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await WidgetBridge.updateTasks({ completed, total })
  } catch {
    // widget plugin not available (simulator / old OS)
  }
}
