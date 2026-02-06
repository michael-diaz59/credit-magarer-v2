import type { DebtStatus } from "./Debt";


export type DebtFilters = {
  companyId: string;
  statuses?: DebtStatus[];
  customerId?: string;
  limit?: number;
};