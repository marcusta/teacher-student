import Foundation

/// A JSON value that can carry an **explicit null**.
///
/// `JSONEncoder` has no way to say "encode this key with the value `null`" from
/// a synthesised `Codable` struct: an `Optional` property that is `nil` is
/// omitted, which is the wrong wire shape for the PATCH bodies this app sends.
/// The generated TS clients build their bodies as plain objects
/// (`body[k] = v` for every non-path key of `input`), so passing
/// `description: null` really does put `"description": null` on the wire — and
/// that null is how the server is told to CLEAR a field. Dropping it would turn
/// "remove the description" into "leave it alone".
///
/// So request bodies are built as `JSONValue.object(…)` rather than as structs.
/// `.null` encodes through `encodeNil()`, which is the only spelling that
/// survives.
indirect enum JSONValue: Encodable, Equatable, Sendable {
    case null
    case bool(Bool)
    case int(Int)
    case double(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null: try container.encodeNil()
        case .bool(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .double(let value): try container.encode(value)
        case .string(let value): try container.encode(value)
        case .array(let values): try container.encode(values)
        case .object(let fields): try container.encode(fields)
        }
    }
}

/// Something that can be a leaf (or array of leaves) in a request body.
protocol JSONRepresentable {
    var jsonValue: JSONValue { get }
}

extension String: JSONRepresentable {
    var jsonValue: JSONValue { .string(self) }
}

extension Int: JSONRepresentable {
    var jsonValue: JSONValue { .int(self) }
}

extension Double: JSONRepresentable {
    var jsonValue: JSONValue { .double(self) }
}

extension Bool: JSONRepresentable {
    var jsonValue: JSONValue { .bool(self) }
}

extension Array: JSONRepresentable where Element: JSONRepresentable {
    var jsonValue: JSONValue { .array(map(\.jsonValue)) }
}

/// A PATCH field's three states, which an `Optional` cannot express.
///
/// The contract distinguishes them: `description?: null | string` means the key
/// may be **absent** (leave the stored value alone), present as **null** (clear
/// it), or present with a **value** (replace it). Modelling that as `String?`
/// collapses the first two, and the collapse is silent — the field simply never
/// clears.
enum PatchField<Value: JSONRepresentable & Sendable>: Sendable {
    /// Omit the key. The stored value is untouched.
    case unchanged
    /// Send `null`. The stored value is cleared.
    case clear
    /// Send the value.
    case set(Value)

    /// `nil` → `.clear`, a value → `.set`. For a form field whose empty state
    /// means "clear this", which is the usual case at a call site.
    static func value(_ optional: Value?) -> PatchField<Value> {
        optional.map(PatchField.set) ?? .clear
    }

    fileprivate var jsonValue: JSONValue? {
        switch self {
        case .unchanged: return nil
        case .clear: return .null
        case .set(let value): return value.jsonValue
        }
    }
}

/// Accumulates a request body the way the generated TS clients do.
///
/// A key lands on the wire only when the caller supplied it; `.clear` writes an
/// explicit `null` instead of dropping the field.
struct JSONBody {
    private var fields: [String: JSONValue] = [:]

    init() {}

    /// A tri-state field. Absent when `.unchanged`.
    mutating func set<Value>(_ key: String, _ field: PatchField<Value>) {
        if let value = field.jsonValue { fields[key] = value }
    }

    /// A plain optional: present when non-nil, omitted otherwise. This is the
    /// `name?: string` arm of the contract, where there is no null to send.
    mutating func set<Value: JSONRepresentable>(_ key: String, optional value: Value?) {
        if let value { fields[key] = value.jsonValue }
    }

    /// A required field that may legitimately be `null` on the wire —
    /// `notes: null | string`, where the key is NOT optional. Always present.
    mutating func set<Value: JSONRepresentable>(_ key: String, nullable value: Value?) {
        fields[key] = value?.jsonValue ?? .null
    }

    /// A required field.
    mutating func set<Value: JSONRepresentable>(_ key: String, _ value: Value) {
        fields[key] = value.jsonValue
    }

    var value: JSONValue { .object(fields) }
}

// MARK: - Shared response envelopes

/// `{ ok: boolean }` / `{ ok: true }`.
struct OkResponse: Codable, Equatable, Sendable {
    let ok: Bool
}

/// `{ changed: boolean }` — only `invitations.revoke` answers this.
struct ChangedResponse: Codable, Equatable, Sendable {
    let changed: Bool
}

// MARK: - Query strings

extension Array where Element == URLQueryItem {
    /// `?a=1&b=2`, or `""` when there is nothing to append — the exact shape the
    /// generated clients build with `URLSearchParams`.
    var queryString: String {
        guard !isEmpty else { return "" }
        var components = URLComponents()
        components.queryItems = self
        guard let query = components.percentEncodedQuery, !query.isEmpty else { return "" }
        return "?" + query
    }
}

/// Percent-encode a path SEGMENT (an id), so an id with a slash or a space
/// cannot rewrite the route.
func pathSegment(_ value: String) -> String {
    value.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? value
}
