import { registerPlugin } from '@capacitor/core'
import { Capacitor } from '@capacitor/core'

export interface CategoryWidgetInfo {
  name: string
  completed: number
  total: number
}

interface WidgetBridgePlugin {
  updateTasks(options: { completed: number; total: number; categoriesJSON?: string }): Promise<void>
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('Widget')

export async function updateWidget(
  completed: number,
  total: number,
  categories?: CategoryWidgetInfo[]
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const opts: Parameters<WidgetBridgePlugin['updateTasks']>[0] = { completed, total }
    if (categories?.length) opts.categoriesJSON = JSON.stringify(categories)
    await WidgetBridge.updateTasks(opts)
  } catch {
    // widget plugin not available (simulator / old OS)
  }
}
