import WidgetKit
import SwiftUI

private let APP_GROUP = "group.app.theanvil"

// ── Data model ───────────────────────────────────────────────────────────────

struct TaskEntry: TimelineEntry {
    let date: Date
    let completed: Int
    let total: Int
}

// ── Timeline provider ─────────────────────────────────────────────────────────

struct TaskProvider: TimelineProvider {
    func placeholder(in context: Context) -> TaskEntry {
        TaskEntry(date: .now, completed: 3, total: 5)
    }

    func getSnapshot(in context: Context, completion: @escaping (TaskEntry) -> Void) {
        completion(readEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskEntry>) -> Void) {
        let entry = readEntry()
        // Expire at midnight so the ring resets for the new day
        var cal = Calendar.current
        var comps = cal.dateComponents([.year, .month, .day], from: .now)
        comps.day! += 1
        let midnight = cal.date(from: comps) ?? .now.addingTimeInterval(86400)
        completion(Timeline(entries: [entry], policy: .after(midnight)))
    }

    private func readEntry() -> TaskEntry {
        let d = UserDefaults(suiteName: APP_GROUP)
        return TaskEntry(
            date: .now,
            completed: d?.integer(forKey: "tasksCompleted") ?? 0,
            total:     d?.integer(forKey: "tasksTotal")     ?? 0
        )
    }
}

// ── Widget view ───────────────────────────────────────────────────────────────

struct AnvilWidgetView: View {
    var entry: TaskEntry

    private var progress: Double {
        guard entry.total > 0 else { return 0 }
        return Double(entry.completed) / Double(entry.total)
    }
    private var isDone: Bool { entry.completed == entry.total && entry.total > 0 }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.15), lineWidth: 5)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    isDone ? Color.green : Color(red: 0.13, green: 0.77, blue: 0.37),
                    style: StrokeStyle(lineWidth: 5, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.5), value: progress)
            VStack(spacing: 1) {
                Text("\(entry.completed)")
                    .font(.system(size: 16, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                if entry.total > 0 {
                    Text("/\(entry.total)")
                        .font(.system(size: 9, weight: .medium))
                        .foregroundStyle(.white.opacity(0.6))
                }
            }
        }
        .containerBackground(Color.clear, for: .widget)
    }
}

// ── Widget configuration ──────────────────────────────────────────────────────

@main
struct TheAnvilWidget: Widget {
    let kind = "TheAnvilWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TaskProvider()) { entry in
            AnvilWidgetView(entry: entry)
        }
        .configurationDisplayName("The Anvil")
        .description("Today's task completion")
        .supportedFamilies([.accessoryCircular])
    }
}
