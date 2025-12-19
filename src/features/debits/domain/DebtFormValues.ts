import type { DebtType } from "./Debit";

export interface DebtFormValues {
  type: DebtType;

  totalAmount: number;

  installmentCount: number;
  startDate: Date;

  // opcional
  firstDueDate?: Date;
}
