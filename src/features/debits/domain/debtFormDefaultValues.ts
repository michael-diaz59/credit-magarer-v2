import type { DebtFormValues } from "./DebtFormValues";

export const debtFormDefaultValues: DebtFormValues = {
  type: 'credito',
  totalAmount: 0,
  installmentCount: 1,
  startDate: new Date(),
};
