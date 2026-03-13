export interface Route {
  id: string;
  name: string;
  description: string;
  /** fechas formato YYYY-MM-DD o string ISO */
  startDisabled?: string;
  endDisabled?: string;
  companyId: string;
}
