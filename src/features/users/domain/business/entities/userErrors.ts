export type getUserError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export type setUserError= 
    | { code: "USER_NOT_FOUND"}
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }