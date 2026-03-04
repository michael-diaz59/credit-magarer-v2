import type { Installment } from "../../features/debits/domain/business/entities/Installment";

const DAY_MS = 1000 * 60 * 60 * 24;

export function isInstallmentLate(installment: Installment): boolean {
  // estados finales → nunca mora
  if (
    installment.status === "pagada" ||
    installment.status === "liquidada" ||
    installment.status === "cancelada"
  ) {
    return false;
  }

  const today = new Date();
  const dueDate = new Date(installment.dueDate);

  const diffDays =
    (today.getTime() - dueDate.getTime()) / DAY_MS;

  return diffDays > 3;
}