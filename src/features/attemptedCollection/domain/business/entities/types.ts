export type AttemptedCollectionErrors =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "NOT_FOUND" };
