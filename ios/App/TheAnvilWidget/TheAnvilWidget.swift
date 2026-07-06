import WidgetKit
import SwiftUI

private let APP_GROUP = "group.app.theanvil"

// ── Data model ───────────────────────────────────────────────────────────────

struct CategoryStatus: Codable {
    let name: String
    let completed: Int
    let total: Int
    var isDone: Bool { total > 0 && completed >= total }
    var shortName: String {
        switch name {
        case "physical":   return "Phys"
        case "mental":     return "Ment"
        case "confidence": return "Conf"
        case "spiritual":  return "Spir"
        case "lifestyle":  return "Life"
        default:           return String(name.prefix(4)).capitalized
        }
    }
}

struct TaskEntry: TimelineEntry {
    let date: Date
    let completed: Int
    let total: Int
    let categories: [CategoryStatus]
    var remaining: Int { max(0, total - completed) }
    var isDone: Bool { total > 0 && completed >= total }
    var progress: Double { total > 0 ? Double(completed) / Double(total) : 0 }
}

// ── Timeline provider ─────────────────────────────────────────────────────────

struct TaskProvider: TimelineProvider {
    func placeholder(in context: Context) -> TaskEntry {
        let cats = ["physical","mental","confidence","spiritual","lifestyle"].map {
            CategoryStatus(name: $0, completed: 0, total: 1)
        }
        return TaskEntry(date: .now, completed: 0, total: 5, categories: cats)
    }

    func getSnapshot(in context: Context, completion: @escaping (TaskEntry) -> Void) {
        completion(readEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskEntry>) -> Void) {
        let entry = readEntry()
        var comps = Calendar.current.dateComponents([.year, .month, .day], from: .now)
        comps.day! += 1
        let midnight = Calendar.current.date(from: comps) ?? .now.addingTimeInterval(86400)
        completion(Timeline(entries: [entry], policy: .after(midnight)))
    }

    private func readEntry() -> TaskEntry {
        let d = UserDefaults(suiteName: APP_GROUP)
        let completed = d?.integer(forKey: "tasksCompleted") ?? 0
        let total     = d?.integer(forKey: "tasksTotal")     ?? 0
        var categories: [CategoryStatus] = []
        if let json = d?.string(forKey: "categoriesJSON"),
           let data = json.data(using: .utf8),
           let cats = try? JSONDecoder().decode([CategoryStatus].self, from: data) {
            categories = cats
        }
        return TaskEntry(date: .now, completed: completed, total: total, categories: categories)
    }
}

// ── Circular view (lock screen small) ────────────────────────────────────────

struct CircularView: View {
    var entry: TaskEntry

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.15), lineWidth: 5)
            Circle()
                .trim(from: 0, to: entry.progress)
                .stroke(
                    entry.isDone ? Color.green : Color(red: 0.13, green: 0.77, blue: 0.37),
                    style: StrokeStyle(lineWidth: 5, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.4), value: entry.progress)
            VStack(spacing: 1) {
                if entry.isDone {
                    Text("✓")
                        .font(.system(size: 18, weight: .black))
                        .foregroundStyle(Color.green)
                } else if entry.total == 0 {
                    Text("—")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.white.opacity(0.5))
                } else {
                    Text("\(entry.remaining)")
                        .font(.system(size: 17, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text("left")
                        .font(.system(size: 8, weight: .medium))
                        .foregroundStyle(.white.opacity(0.6))
                }
            }
        }
        .containerBackground(Color.clear, for: .widget)
    }
}

// ── Rectangular view (lock screen wide) ──────────────────────────────────────

struct RectangularView: View {
    var entry: TaskEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            // Headline
            HStack(spacing: 5) {
                Image(systemName: entry.isDone ? "checkmark.circle.fill" : "hammer.fill")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(entry.isDone ? Color.green : Color.white.opacity(0.6))
                if entry.total == 0 {
                    Text("No tasks today")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.white.opacity(0.6))
                } else if entry.isDone {
                    Text("All done today!")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.green)
                } else {
                    Text("\(entry.remaining) task\(entry.remaining == 1 ? "" : "s") left")
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Spacer()
                    Text("\(entry.completed)/\(entry.total)")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Color.white.opacity(0.5))
                }
            }

            // Category dots row
            if !entry.categories.isEmpty {
                HStack(spacing: 8) {
                    ForEach(entry.categories, id: \.name) { cat in
                        HStack(spacing: 3) {
                            Circle()
                                .fill(cat.isDone ? Color.green : Color.white.opacity(0.2))
                                .frame(width: 5, height: 5)
                            Text(cat.shortName)
                                .font(.system(size: 9, weight: .medium))
                                .foregroundStyle(cat.isDone ? Color.green : Color.white.opacity(0.5))
                        }
                    }
                }
            } else if entry.total > 0 {
                // Fallback: progress bar
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.white.opacity(0.12)).frame(height: 3)
                        Capsule()
                            .fill(entry.isDone ? Color.green : Color(red: 0.13, green: 0.77, blue: 0.37))
                            .frame(width: geo.size.width * entry.progress, height: 3)
                    }
                }.frame(height: 3)
            }
        }
        .containerBackground(Color.clear, for: .widget)
    }
}

// ── Entry view dispatcher ─────────────────────────────────────────────────────

struct AnvilWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: TaskEntry

    var body: some View {
        switch family {
        case .accessoryCircular:
            CircularView(entry: entry)
        case .accessoryRectangular:
            RectangularView(entry: entry)
        default:
            CircularView(entry: entry)
        }
    }
}

// ── Widget configuration ──────────────────────────────────────────────────────

@main
struct TheAnvilWidget: Widget {
    let kind = "TheAnvilWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TaskProvider()) { entry in
            AnvilWidgetEntryView(entry: entry)
                .widgetURL(URL(string: "theanvil://"))
        }
        .configurationDisplayName("The Anvil")
        .description("Today's task progress")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}
