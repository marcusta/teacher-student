import Foundation

/// One field-level problem from the server's validation envelope.
struct ApiErrorDetail: Decodable, Equatable, Sendable {
    let path: String
    let message: String
}

/// The classification `vendor/basics-core/client/request.ts` derives from the
/// transport result. Views map this to authored Swedish copy — never the
/// server's own `message`, which is developer English.
enum ApiErrorCode: String, Sendable {
    case auth
    case conflict
    case validation
    case rateLimit
    /// 404 — and, by IA §1, also the shape a cross-owner resource takes, since
    /// the server answers 404 rather than leaking its existence. Kept apart from
    /// `.server` because the two want opposite screens: a not-found is final and
    /// wants a way back, a server failure is transient and wants a retry.
    case notFound
    /// 403. The server prefers 404 for owner-scoped reads, so this is rare — but
    /// when it does arrive it must not read as "something broke on our end".
    case forbidden
    case server
    case network
    case timeout
    case unknown
}

/// Port of `vendor/basics-core/client/api-error.ts`, with the code mapping of
/// `request.ts` folded in so a caller has one thing to catch.
///
/// The server envelope is `{ error: string, details?: [{path, message}] }`.
/// `rawDetails` keeps the details verbatim because the shape is only a
/// convention — a payload that does not match `[ApiErrorDetail]` is preserved
/// rather than dropped.
struct ApiError: Error, Sendable {
    /// HTTP status, or `nil` for a transport failure (no response arrived).
    let status: Int?
    let code: ApiErrorCode
    /// Server text or a transport description. NOT for display.
    let message: String
    /// The `details` member of the envelope, exactly as received.
    let rawDetails: Data?
    let traceId: String?

    init(
        status: Int?,
        code: ApiErrorCode,
        message: String,
        rawDetails: Data? = nil,
        traceId: String? = nil
    ) {
        self.status = status
        self.code = code
        self.message = message
        self.rawDetails = rawDetails
        self.traceId = traceId
    }

    /// Field-level problems, when the details payload follows the convention.
    var details: [ApiErrorDetail]? {
        guard let rawDetails else { return nil }
        return try? JSONDecoder().decode([ApiErrorDetail].self, from: rawDetails)
    }

    /// Build from an HTTP response. Mirrors `toRequestError`: 401 → auth,
    /// 409 → conflict, 400 → validation, 429 → rateLimit (kept apart from 500
    /// because "try again" is right for one and wrong for the other), and
    /// 404/403 → notFound/forbidden, so a screen can tell a missing object from
    /// a broken server without reading `status` by hand.
    static func fromResponse(
        status: Int,
        message: String,
        rawDetails: Data?,
        traceId: String?
    ) -> ApiError {
        let code: ApiErrorCode
        switch status {
        case 401: code = .auth
        case 409: code = .conflict
        case 400: code = .validation
        case 403: code = .forbidden
        case 404: code = .notFound
        case 429: code = .rateLimit
        default: code = .server
        }
        return ApiError(status: status, code: code, message: message, rawDetails: rawDetails, traceId: traceId)
    }

    static func transport(_ error: Error, traceId: String?) -> ApiError {
        let nsError = error as NSError
        let timedOut = nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorTimedOut
        return ApiError(
            status: nil,
            code: timedOut ? .timeout : .network,
            message: nsError.localizedDescription,
            traceId: traceId
        )
    }
}
