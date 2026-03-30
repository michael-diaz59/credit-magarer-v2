export interface Route {
  id: string;
  name: string;
  description: string;
  /** fechas formato YYYY-MM-DD o string ISO */
  startDisabled?: string;
  endDisabled?: string;
  companyId: string;
  cobradorId?: string;
  totalCash?: number;
  totalCash2?: CashBalances[];
  totalDeposit?: DepositBalances[];
}

/**representa los depositos que hacen los cobradores a cuentas bancarias*/
export interface DepositBalances {
  bankAccountId: string;
  /**monto ingresado a la cuenta */
  amount: number;
}

/**representa el efectivo que tienen los cobradores*/
export interface CashBalances {
  collectorId: string;
  /**monto en efectivo que ingreso el cobrador*/
  amount: number;
}

