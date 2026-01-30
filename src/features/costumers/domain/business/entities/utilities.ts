export type GetCostumersErrors =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
    | { code: "PERMISSION_DENIED" }
    | { code: "INVALID_INPUT" }

export type GetCostumerByIdErrors =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }

export type  SaveCostumerError=
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
    | { code: "DOCUMENT_EXISTING" }
