import Foundation

/// Date parsing and formatting — a port of the framework `i18n.ts` helpers the
/// web client re-exports (`formatDate`, `formatTimeRange`, `formatMonthAbbrev`,
/// `formatMonthBlock`, `formatIsoDate`, `formatRelative`).
///
/// Everything renders in the reader's own time zone with the active locale, and
/// DTOs keep their ISO strings (PLAN.md §3) — conversion happens here, at the
/// view layer, and nowhere else.
extension I18n {

    /// The recipes the web client actually uses. Named rather than free-form so
    /// a screen cannot invent a fourteenth date format.
    enum DateRecipe {
        /// `22` — day of month, for the fixed-width date block.
        case dayOfMonth
        /// `17:00` — clock time.
        case clockTime
        /// `onsdag 22 juli` — long day.
        case longDay
        /// `14 juli 19:04` — the §4.7 entry timestamp.
        case noteTimestamp
        /// `14 juli`.
        case dayMonth
        /// `14 juli 2026`.
        case dayMonthYear
        /// `22 juli 2026`, the default of the web `formatDate`.
        case fullDate

        var template: String {
            switch self {
            case .dayOfMonth: return "d"
            case .clockTime: return "Hm"
            case .longDay: return "EEEEdMMMM"
            case .noteTimestamp: return "dMMMMHm"
            case .dayMonth: return "dMMMM"
            case .dayMonthYear: return "dMMMMy"
            case .fullDate: return "dMMMMy"
            }
        }
    }

    // MARK: - Parsing

    /// Parse an ISO-8601 timestamp, with or without fractional seconds.
    ///
    /// Both spellings occur: SQLite-backed rows serialise as
    /// `2026-07-14T19:04:00.000Z` while hand-written fixtures drop the
    /// milliseconds, and `ISO8601DateFormatter` is strict about which it takes.
    /// Plain `YYYY-MM-DD` calendar dates (goal target dates, plan ranges) are
    /// accepted too and resolve to local midnight.
    ///
    /// The fourth spelling is SQLite's: columns defaulted to `datetime('now')`
    /// — `invitations.created_at` among them — store `2026-07-25 12:34:56`, a
    /// space rather than a `T` and no zone. JS `new Date()` takes that form, so
    /// the web renders a date where a stricter parser would render the raw
    /// string back at the reader. SQLite's `datetime()` is UTC, so it is read as
    /// UTC and displayed in the reader's zone like every other timestamp.
    static func date(fromISO value: String) -> Date? {
        if let date = isoWithFraction.date(from: value) { return date }
        if let date = isoPlain.date(from: value) { return date }
        if let date = sqliteParser.date(from: value) { return date }
        return calendarDayParser.date(from: value)
    }

    // MARK: - Formatting

    static func formatDate(_ date: Date, _ recipe: DateRecipe = .fullDate) -> String {
        templated(recipe.template).string(from: date)
    }

    static func formatDate(iso: String, _ recipe: DateRecipe = .fullDate) -> String? {
        date(fromISO: iso).map { formatDate($0, recipe) }
    }

    /// `17:00–18:00`. The separator comes from the locale, not from a literal.
    static func formatTimeRange(_ start: Date, _ end: Date) -> String {
        intervalFormatter.string(from: start, to: end)
    }

    static func formatTimeRange(isoStart: String, isoEnd: String) -> String? {
        guard let start = date(fromISO: isoStart), let end = date(fromISO: isoEnd) else { return nil }
        return formatTimeRange(start, end)
    }

    /// Abbreviated month, CLDR-correct and upper-cased: sv `juli` → `JULI`,
    /// en `Jul` → `JUL`. The trailing abbreviation dot is stripped.
    static func formatMonthAbbrev(_ date: Date) -> String {
        var month = templated("MMM").string(from: date)
        if month.hasSuffix(".") { month.removeLast() }
        return month.uppercased(with: locale)
    }

    /// Month for the fixed-width DATE BLOCK (`22 / JUL / 17:00`) — exactly three
    /// upper-case characters.
    ///
    /// A TYPOGRAPHIC constraint, not a linguistic one: a four-character month
    /// (`JULI`, `MARS`, `JUNI`) breaks the block's alignment. Deliberately not
    /// CLDR-correct, and deliberately separate from `formatMonthAbbrev`.
    static func formatMonthBlock(_ date: Date) -> String {
        String(formatMonthAbbrev(date).prefix(3))
    }

    /// `2026-07-14`. Deliberately NOT locale-formatted — the machine-readable
    /// calendar date, computed from local time parts.
    static func formatIsoDate(_ date: Date) -> String {
        let parts = localCalendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    /// The inverse of `formatIsoDate`: `2026-07-14` back to noon local time on
    /// that day.
    ///
    /// Strict on purpose — anything that is not exactly `YYYY-MM-DD` returns
    /// nil rather than a plausible wrong day, and the result is re-checked by
    /// reading the components back, because `DateComponents` happily rolls
    /// `2026-02-31` over into 3 March. LOCAL, never UTC: a calendar date parsed
    /// as UTC renders as the previous day for anyone west of Greenwich.
    ///
    /// NOON, not midnight, and that is the whole reason the hour is set at all:
    /// in a zone whose DST transition lands at 00:00 and skips forward, local
    /// midnight for that day does not exist, `Calendar.date(from:)` answers the
    /// next existing instant, and the read-back check below then rejects a
    /// perfectly valid date. Noon is an hour no transition has ever removed.
    static func calendarDate(fromISO value: String?) -> Date? {
        guard let value, value.count == 10 else { return nil }
        let parts = value.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 3,
              let year = Int(parts[0]), parts[0].count == 4,
              let month = Int(parts[1]), parts[1].count == 2,
              let day = Int(parts[2]), parts[2].count == 2
        else { return nil }

        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        components.hour = 12
        let calendar = localCalendar
        guard let date = calendar.date(from: components) else { return nil }
        let back = calendar.dateComponents([.year, .month, .day], from: date)
        guard back.year == year, back.month == month, back.day == day else { return nil }
        return date
    }

    /// Human-relative time: `för 2 tim sedan`, `i går`, `om 5 min`.
    ///
    /// Same shape as the web helper. Clock units while we are on the same
    /// calendar day, or while the gap is under six hours — so 04:00 today reads
    /// `för 8 tim sedan` rather than `i dag`, and 09:00 tomorrow reads
    /// `i morgon` rather than `om 21 tim`. Inside a 7-day window the day scale
    /// takes over; beyond it, an absolute date.
    ///
    /// DAY-SCALE COPY OVERRIDES: `relative.yesterday` / `relative.today` /
    /// `relative.tomorrow` win for days -1/0/+1 when the catalog defines them.
    /// The design spec's authored voice is `i går` / `i morgon` with a space,
    /// where CLDR Swedish gives `igår` / `imorgon`; both are correct Swedish, so
    /// the decision belongs in the catalog. This is a catalog LOOKUP, never a
    /// string replacement on formatter output.
    static func formatRelative(_ value: Date, now: Date = Date()) -> String {
        let seconds = value.timeIntervalSince(now)
        let magnitude = abs(seconds)
        let startOfValue = localCalendar.startOfDay(for: value)
        let startOfNow = localCalendar.startOfDay(for: now)
        let days = localCalendar.dateComponents([.day], from: startOfNow, to: startOfValue).day ?? 0

        if days == 0 || magnitude < 6 * 3600 {
            // `.short`, not `.abbreviated`: Swedish `.abbreviated` renders a bare
            // signed magnitude ('−5 h'), which reads as a negative quantity
            // rather than as past time. The web's Intl 'short' style says
            // 'för 5 tim sedan', and that phrasing is the one to match.
            let clock = relativeFormatter(.short)
            if magnitude < 60 {
                return clock.localizedString(from: DateComponents(second: Int(seconds.rounded())))
            }
            if magnitude < 3600 {
                return clock.localizedString(from: DateComponents(minute: Int((seconds / 60).rounded())))
            }
            return clock.localizedString(from: DateComponents(hour: Int((seconds / 3600).rounded())))
        }

        if abs(days) < 7 {
            if let override = relativeDayKeys[days].flatMap({ raw($0) }) { return override }
            return relativeFormatter(.full).localizedString(from: DateComponents(day: days))
        }

        let sameYear = localCalendar.component(.year, from: value) == localCalendar.component(.year, from: now)
        return formatDate(value, sameYear ? .dayMonth : .dayMonthYear)
    }

    static func formatRelative(iso: String, now: Date = Date()) -> String? {
        date(fromISO: iso).map { formatRelative($0, now: now) }
    }

    // MARK: - Formatter cache

    private static let relativeDayKeys: [Int: String] = [
        -1: "relative.yesterday",
        0: "relative.today",
        1: "relative.tomorrow",
    ]

    private static let formatterLock = NSLock()
    private static var dateFormatters: [String: DateFormatter] = [:]
    private static var relativeFormatters: [String: RelativeDateTimeFormatter] = [:]
    private static var intervalFormatters: [String: DateIntervalFormatter] = [:]

    private static var localCalendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.locale = locale
        calendar.timeZone = .current
        return calendar
    }

    /// A `DateFormatter` built from a skeleton, so the field ORDER is the
    /// locale's and only the field set is ours.
    private static func templated(_ template: String) -> DateFormatter {
        let code = localeCode
        let key = "\(code)|\(template)"
        formatterLock.lock(); defer { formatterLock.unlock() }
        if let cached = dateFormatters[key] { return cached }
        let formatter = DateFormatter()
        formatter.locale = locale
        formatter.timeZone = .current
        formatter.setLocalizedDateFormatFromTemplate(template)
        dateFormatters[key] = formatter
        return formatter
    }

    private static func relativeFormatter(_ style: RelativeDateTimeFormatter.UnitsStyle) -> RelativeDateTimeFormatter {
        let key = "\(localeCode)|\(style.rawValue)"
        formatterLock.lock(); defer { formatterLock.unlock() }
        if let cached = relativeFormatters[key] { return cached }
        let formatter = RelativeDateTimeFormatter()
        formatter.locale = locale
        formatter.calendar = localCalendar
        formatter.unitsStyle = style
        // `.named` is the equivalent of Intl's numeric:'auto' — it is what turns
        // -1 day into 'igår' before the catalog override replaces it.
        formatter.dateTimeStyle = .named
        relativeFormatters[key] = formatter
        return formatter
    }

    private static var intervalFormatter: DateIntervalFormatter {
        let key = localeCode
        formatterLock.lock(); defer { formatterLock.unlock() }
        if let cached = intervalFormatters[key] { return cached }
        let formatter = DateIntervalFormatter()
        formatter.locale = locale
        formatter.timeZone = .current
        formatter.dateTemplate = "Hm"
        intervalFormatters[key] = formatter
        return formatter
    }

    private static let isoWithFraction: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let isoPlain: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    /// SQLite `datetime('now')` — `yyyy-MM-dd HH:mm:ss`, always UTC.
    private static let sqliteParser: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter
    }()

    /// `YYYY-MM-DD` with no time part, resolved to local midnight.
    private static let calendarDayParser: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
