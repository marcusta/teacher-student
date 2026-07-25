import Foundation

/// Per-call transport switches. Mirrors `RequestOptions` in
/// `vendor/basics-core/client/request.ts`.
struct RequestOptions: Sendable {
    /// Whether a 401 from this call publishes session expiry. Default `true`.
    ///
    /// Pass `false` for the auth endpoints themselves: a 401 from
    /// `POST /auth/login` means "wrong credentials", not "session expired", and
    /// treating it as expiry would sign the user out mid sign-in.
    var sessionExpiry: Bool = true
    var timeout: TimeInterval = 30

    static let `default` = RequestOptions()
    /// The opt-out used by `/auth/login` and `/auth/logout`.
    static let authEndpoint = RequestOptions(sessionExpiry: false)
}

/// Request body placeholder for calls that send `{}` (the web `logout` does).
struct EmptyBody: Encodable {
    init() {}
}

/// Response placeholder for calls whose body is uninteresting.
struct EmptyResponse: Decodable {
    init() {}
    init(from decoder: Decoder) throws {}
}

extension Notification.Name {
    /// Posted on the main queue when any authenticated call returns 401.
    /// `SessionStore` observes it and drops the stale user, which returns the
    /// app to the auth gate (PLAN.md §Hard conventions 6).
    static let apiSessionExpired = Notification.Name("se.mackans.teacherstudent.sessionExpired")
}

/// `URLSession`-based API client — the transport half of
/// `vendor/basics-core/client/fetch.ts`.
///
/// - JSON in, JSON out, `Codable` both ways.
/// - Session cookie auth through the shared `HTTPCookieStorage`, so a
///   `Set-Cookie: session=…` is stored and replayed without the app touching it.
/// - Error responses become `ApiError`, classified as `request.ts` classifies
///   them.
/// - GET retries twice with exponential backoff on transport failures;
///   mutations never retry.
/// - 401 publishes `.apiSessionExpired` unless the caller opted out.
final class ApiClient: @unchecked Sendable {
    static let shared = ApiClient()

    /// `UserDefaults` key holding the API root, e.g. `http://localhost:4810/api`.
    static let baseURLDefaultsKey = "apiBaseURL"

    /// Debug default. A release build is expected to have `apiBaseURL` written
    /// into `UserDefaults` at provisioning time — there is no production host to
    /// hardcode yet, and the ATS exception covers localhost only.
    static let fallbackBaseURL = "http://localhost:4810/api"

    private let session: URLSession
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    init(session: URLSession? = nil) {
        if let session {
            self.session = session
        } else {
            let configuration = URLSessionConfiguration.default
            configuration.httpCookieStorage = HTTPCookieStorage.shared
            configuration.httpCookieAcceptPolicy = .always
            configuration.httpShouldSetCookies = true
            configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
            self.session = URLSession(configuration: configuration)
        }
        encoder = JSONEncoder()
        decoder = JSONDecoder()
    }

    /// The API root. Overridable at runtime so a device build can be pointed at
    /// a LAN address without a rebuild.
    var baseURL: URL {
        let stored = UserDefaults.standard.string(forKey: Self.baseURLDefaultsKey)
        let raw = (stored?.isEmpty == false ? stored! : Self.fallbackBaseURL)
        let trimmed = raw.hasSuffix("/") ? String(raw.dropLast()) : raw
        // A malformed override must not take the app down; it falls back to the
        // built-in default and the failing requests say so.
        return URL(string: trimmed) ?? URL(string: Self.fallbackBaseURL)!
    }

    // MARK: - Verbs

    func get<Response: Decodable>(
        _ path: String,
        as: Response.Type = Response.self,
        options: RequestOptions = .default
    ) async throws -> Response {
        try await send(method: "GET", path: path, body: Optional<EmptyBody>.none, options: options)
    }

    func post<Body: Encodable, Response: Decodable>(
        _ path: String,
        body: Body,
        as: Response.Type = Response.self,
        options: RequestOptions = .default
    ) async throws -> Response {
        try await send(method: "POST", path: path, body: body, options: options)
    }

    func post<Response: Decodable>(
        _ path: String,
        as: Response.Type = Response.self,
        options: RequestOptions = .default
    ) async throws -> Response {
        try await send(method: "POST", path: path, body: EmptyBody(), options: options)
    }

    func patch<Body: Encodable, Response: Decodable>(
        _ path: String,
        body: Body,
        as: Response.Type = Response.self,
        options: RequestOptions = .default
    ) async throws -> Response {
        try await send(method: "PATCH", path: path, body: body, options: options)
    }

    /// Only `programs.reorderExercises` uses PUT — the order of a Program's rows
    /// is replaced wholesale, not merged, and the generated client says so.
    func put<Body: Encodable, Response: Decodable>(
        _ path: String,
        body: Body,
        as: Response.Type = Response.self,
        options: RequestOptions = .default
    ) async throws -> Response {
        try await send(method: "PUT", path: path, body: body, options: options)
    }

    func delete<Response: Decodable>(
        _ path: String,
        as: Response.Type = Response.self,
        options: RequestOptions = .default
    ) async throws -> Response {
        try await send(method: "DELETE", path: path, body: Optional<EmptyBody>.none, options: options)
    }

    // MARK: - Cookies

    #if DEBUG
    /// The `session` cookie currently stored for the API host, if any.
    func sessionCookie(named name: String = "session") -> HTTPCookie? {
        HTTPCookieStorage.shared.cookies(for: baseURL)?.first { $0.name == name }
    }

    /// Install a raw session token as the `session` cookie for the API host.
    /// See `SessionStore.adoptSessionToken` for why this exists.
    ///
    /// DEBUG-only, and the fence is the point: a release binary must not ship an
    /// "install an arbitrary session cookie" entry point. Returns false when the
    /// base URL has no host — a URL typed without a scheme parses as
    /// `scheme: "localhost"`, `host: nil`, and silently dropping the token there
    /// leaves the reader with an unexplained 401.
    @discardableResult
    func setSessionCookie(_ token: String, named name: String = "session") -> Bool {
        guard let host = baseURL.host else { return false }
        var properties: [HTTPCookiePropertyKey: Any] = [
            .name: name,
            .value: token,
            .domain: host,
            .path: "/",
            .expires: Date().addingTimeInterval(60 * 60 * 24 * 30),
        ]
        properties[HTTPCookiePropertyKey("HttpOnly")] = "TRUE"
        guard let cookie = HTTPCookie(properties: properties) else { return false }
        HTTPCookieStorage.shared.setCookie(cookie)
        return true
    }
    #endif

    // MARK: - Core

    private func send<Body: Encodable, Response: Decodable>(
        method: String,
        path: String,
        body: Body?,
        options: RequestOptions
    ) async throws -> Response {
        // GET is the only idempotent verb here, so it is the only one retried.
        let retries = method == "GET" ? 2 : 0
        var lastError: ApiError?

        for attempt in 0...retries {
            do {
                return try await perform(method: method, path: path, body: body, options: options)
            } catch let error as ApiError {
                lastError = error
                // A response arrived; retrying would only repeat the answer.
                if error.status != nil { break }
                if attempt == retries { break }
                // `try`, not `try?`: a cancelled backoff must abort the loop
                // rather than swallow the cancellation and issue another GET.
                try await Task.sleep(nanoseconds: UInt64(1_000_000_000 * (1 << attempt)))
            }
        }
        throw lastError ?? ApiError(status: nil, code: .unknown, message: "Unknown error")
    }

    private func perform<Body: Encodable, Response: Decodable>(
        method: String,
        path: String,
        body: Body?,
        options: RequestOptions
    ) async throws -> Response {
        let traceId = UUID().uuidString
        var request = URLRequest(url: url(for: path))
        request.httpMethod = method
        request.timeoutInterval = options.timeout
        request.setValue(traceId, forHTTPHeaderField: "X-Trace-Id")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            // A cancelled `Task` surfaces here as `URLError(.cancelled)`. That is
            // not a failure the reader caused or can act on — it means they left
            // the screen — so it must never reach a store as a `.network` error
            // and paint a retry over a screen where nothing went wrong.
            if (error as NSError).code == NSURLErrorCancelled { throw CancellationError() }
            throw ApiError.transport(error, traceId: traceId)
        }

        guard let http = response as? HTTPURLResponse else {
            throw ApiError(status: nil, code: .unknown, message: "Malformed response", traceId: traceId)
        }
        let serverTraceId = http.value(forHTTPHeaderField: "x-trace-id") ?? traceId

        guard (200..<300).contains(http.statusCode) else {
            let envelope = decodeEnvelope(data)
            let error = ApiError.fromResponse(
                status: http.statusCode,
                message: envelope.message ?? HTTPURLResponse.localizedString(forStatusCode: http.statusCode),
                rawDetails: envelope.details,
                traceId: serverTraceId
            )
            if error.code == .auth, options.sessionExpiry {
                await MainActor.run {
                    NotificationCenter.default.post(name: .apiSessionExpired, object: nil)
                }
            }
            throw error
        }

        if Response.self == EmptyResponse.self {
            return EmptyResponse() as! Response
        }
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw ApiError(
                status: http.statusCode,
                code: .unknown,
                message: "Decoding failed: \(error)",
                traceId: serverTraceId
            )
        }
    }

    /// `${baseURL}${path}` — string concatenation, exactly as the generated TS
    /// clients build their URLs.
    ///
    /// NOT `appendingPathComponent`: that percent-encodes the whole string it is
    /// given, so `notes?parentKind=lesson` would arrive as a path segment
    /// literally named `notes%3FparentKind=lesson` and every GET with a query
    /// would 404. Callers hand in an already-encoded path — ids go through
    /// `pathSegment()` and query strings through `URLComponents` — so there is
    /// nothing left to escape here.
    private func url(for path: String) -> URL {
        let suffix = path.hasPrefix("/") ? path : "/" + path
        return URL(string: baseURL.absoluteString + suffix) ?? baseURL
    }

    /// `{ error: string, details?: unknown }` — the server's error envelope.
    private func decodeEnvelope(_ data: Data) -> (message: String?, details: Data?) {
        guard
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return (nil, nil) }
        let message = object["error"] as? String
        let details = object["details"].flatMap { value -> Data? in
            guard JSONSerialization.isValidJSONObject([value]) else { return nil }
            return try? JSONSerialization.data(withJSONObject: value)
        }
        return (message, details)
    }
}
