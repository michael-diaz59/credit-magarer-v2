import type { Debt, DebtStatus } from
"../../features/debits/domain/business/entities/Debt";

const DAY_MS = 1000 * 60 * 60 * 24;

export function isDebtLate(debt: Debt): boolean {
  // solo aplica a deudas activas
  if(debt.status !== "activa") return false;

  // sin próxima fecha → probablemente pagada
  if (!debt.nextPaymentDue) return false;

  const today = new Date();
  const nextDue = new Date(debt.nextPaymentDue);

  const diffDays =
    (today.getTime() - nextDue.getTime()) / DAY_MS;

  if (diffDays <= 0) return false;

  // regla por tipo
  if (debt.debtTerms === "diario") {
    return diffDays > 3;
  }

  return diffDays >= 1;
}

/**
 * Estado visual derivado
 */
export function getDebtVisualStatus(debt: Debt): DebtStatus {
  if (isDebtLate(debt)) {
    return "en_mora";
  }

  return debt.status;
}