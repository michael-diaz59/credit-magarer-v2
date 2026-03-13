export type RouteErrorCode = 
  | "UNKNOWN_ERROR" 
  | "NETWORK_ERROR" 
  | "NOT_FOUND" 
  | "INVALID_DATA";

export interface RouteError {
  code: RouteErrorCode;
  message?: string;
}
