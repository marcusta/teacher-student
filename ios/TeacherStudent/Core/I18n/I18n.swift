import Foundation

/// Message catalogs — a port of `web/i18n.ts` + the framework's `i18n.ts`.
///
/// Catalogs are the web client's own `sv.json` / `en.json`, bundled as
/// resources. They are FLAT maps of dot-separated key → string; nesting is not
/// supported, exactly as on the web. Plural forms are ordinary flat keys with a
/// CLDR category suffix (`.zero` / `.one` / `.other`).
///
/// Swedish is the source of truth and the fallback: a key missing from `en`
/// resolves through `sv` rather than rendering the raw key. There is no
/// auto-detection from the device language — this is a Swedish product, so
/// `sv` is the default and only an explicit choice changes it.
enum I18n {
    static let fallbackLocaleCode = "sv"

    private static let lock = NSLock()
    private static var catalogs: [String: [String: String]] = [:]
    private static var localeCodeStorage = fallbackLocaleCode
    private static var warned: Set<String> = []

    /// Active locale code (`sv` / `en`).
    static var localeCode: String {
        lock.lock(); defer { lock.unlock() }
        return localeCodeStorage
    }

    /// Foundation locale for every formatter in the app. Region follows the
    /// language because dates and number separators are what it drives.
    static var locale: Locale {
        Locale(identifier: localeCode == "en" ? "en_GB" : "sv_SE")
    }

    /// Load the bundled catalogs. Call once, at launch, before any `t()`.
    static func bootstrap(bundle: Bundle = .main) {
        register(locale: "sv", from: bundle)
        register(locale: "en", from: bundle)
    }

    /// Switch locale. Not persisted — there is no language picker yet.
    static func setLocale(_ code: String) {
        lock.lock(); defer { lock.unlock() }
        localeCodeStorage = code
    }

    // MARK: - Lookup

    /// Translate a flat key, interpolating `{name}` placeholders.
    static func t(_ key: String, _ params: [String: String] = [:]) -> String {
        guard let text = raw(key) else { return missing(key) }
        return interpolate(text, params)
    }

    /// Translate a pluralised key.
    ///
    /// Picks `<key>.zero` when the count is 0 and that key exists, otherwise the
    /// CLDR category for the active locale, otherwise `<key>.other`. `{count}`
    /// is available as a placeholder without passing it.
    ///
    /// Swedish and English share the same rule — `one` for exactly 1, `other`
    /// for everything else. A third locale would need real CLDR categories here.
    static func plural(_ key: String, _ count: Int, _ params: [String: String] = [:]) -> String {
        let category: String
        if count == 0, raw("\(key).zero") != nil {
            category = "zero"
        } else {
            category = count == 1 ? "one" : "other"
        }
        guard let text = raw("\(key).\(category)") ?? raw("\(key).other") else {
            return missing("\(key).\(category)")
        }
        // `count` first, then the caller's params over it — the order the web
        // uses (`interpolate(text, { count, ...params })`), so an explicit
        // `count` param wins rather than being silently overwritten.
        var merged = ["count": String(count)]
        merged.merge(params) { _, caller in caller }
        return interpolate(text, merged)
    }

    /// Upper-case the first character using the active locale's casing rules.
    static func capitalize(_ value: String) -> String {
        guard let first = value.first else { return value }
        return String(first).uppercased(with: locale) + value.dropFirst()
    }

    /// Raw catalog read: active locale, then the fallback locale. Internal so
    /// the date helpers can consult `relative.*` overrides the same way the web
    /// `formatRelative` does — as a catalog lookup, never a string replacement.
    static func raw(_ key: String) -> String? {
        lock.lock(); defer { lock.unlock() }
        return catalogs[localeCodeStorage]?[key] ?? catalogs[fallbackLocaleCode]?[key]
    }

    // MARK: - Internals

    private static func register(locale code: String, from bundle: Bundle) {
        guard
            let url = bundle.url(forResource: code, withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            assertionFailure("i18n: catalog \(code).json is missing from the bundle")
            return
        }
        let messages = parsed.compactMapValues { $0 as? String }
        lock.lock()
        catalogs[code] = messages
        lock.unlock()
    }

    /// A missing key renders as the key itself and warns once. Loud in the log,
    /// visible on screen, never fatal — a typo in a rare branch must not blank
    /// out a view.
    private static func missing(_ key: String) -> String {
        lock.lock()
        let isNew = warned.insert(key).inserted
        let active = localeCodeStorage
        lock.unlock()
        if isNew {
            print("[i18n] missing key \"\(key)\" for locale \"\(active)\"")
        }
        return key
    }

    /// Placeholders are `{name}`. Unknown placeholders are left untouched.
    private static func interpolate(_ text: String, _ params: [String: String]) -> String {
        guard !params.isEmpty, text.contains("{") else { return text }
        var out = ""
        var rest = Substring(text)
        while let open = rest.firstIndex(of: "{") {
            out += rest[rest.startIndex..<open]
            guard let close = rest[open...].firstIndex(of: "}") else {
                out += rest[open...]
                return out
            }
            let name = String(rest[rest.index(after: open)..<close])
            if let value = params[name] {
                out += value
            } else {
                out += rest[open...close]
            }
            rest = rest[rest.index(after: close)...]
        }
        out += rest
        return out
    }
}
