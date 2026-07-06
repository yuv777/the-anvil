import Capacitor
import WidgetKit

@objc(WidgetPlugin)
public class WidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier   = "WidgetPlugin"
    public let jsName       = "Widget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateTasks", returnType: CAPPluginReturnPromise),
    ]

    private let appGroup = "group.app.theanvil"

    @objc func updateTasks(_ call: CAPPluginCall) {
        let completed      = call.getInt("completed")         ?? 0
        let total          = call.getInt("total")             ?? 0
        let categoriesJSON = call.getString("categoriesJSON") ?? ""

        if let defaults = UserDefaults(suiteName: appGroup) {
            defaults.set(completed, forKey: "tasksCompleted")
            defaults.set(total,     forKey: "tasksTotal")
            if !categoriesJSON.isEmpty {
                defaults.set(categoriesJSON, forKey: "categoriesJSON")
            }
            defaults.synchronize()
        }

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        call.resolve()
    }
}
