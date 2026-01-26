export type GetLogInErros =
    | { code: "SESSION_INVALID" }
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export type LoginError =
    | { code: "INVALID_CREDENTIALS" }
    | { code: "USER_NOT_REGISTERED" }
    | { code: "USER_NOT_ALLOWED" }
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export type LogoutError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }