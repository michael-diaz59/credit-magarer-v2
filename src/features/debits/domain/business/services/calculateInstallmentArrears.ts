import type { Installment } from "../entities/Installment";
import type { Debt } from "../entities/Debt";
import { calculateInstallmentLateInterest } from "../useCases/helper";
import { IsPastDate } from "../../../../../core/helpers/dates/calculateDays";

export interface CalculateInstallmentArrearsParams {
  installment: Installment;
  debt?: Debt | null;
  referenceDate?: Date;
}

export interface InstallmentArrearsResult {
  delayDays: number;
  rateUsed: number;
  accruedArrears: number;
  pendingArrears: number;
  pendingDeferment: number;
  totalPendingArrears: number;
}

/**
 * Calcula dinámicamente la mora acumulada y pendiente por cobrar de una cuota,
 * considerando los días de retraso respecto a la fecha efectiva (paymentDate || dueDate).
 */
export function calculateInstallmentArrears({
  installment,
  debt,
  referenceDate,
}: CalculateInstallmentArrearsParams): InstallmentArrearsResult {
  // Cuotas pagadas no devengan mora
  if (installment.status === "pagada") {
    return {
      delayDays: 0,
      rateUsed: 0,
      accruedArrears: 0,
      pendingArrears: 0,
      pendingDeferment: 0,
      totalPendingArrears: 0,
    };
  }

  const effectiveDateStr = installment.paymentDate || installment.dueDate;
  const isOverdue = effectiveDateStr ? IsPastDate(effectiveDateStr) : false;

  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);

  let delayDays = 0;
  if (effectiveDateStr) {
    const itemDate = new Date(effectiveDateStr);
    itemDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - itemDate.getTime();
    delayDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }

  const defermentPending = Math.max(
    0,
    (installment.deferment ?? 0) -
      (installment.defermentPaid ?? 0) -
      (installment.pendingDeferment ?? 0),
    installment.outstandingReceivablesDeferment ?? 0,
    installment.remainingDefermentToPay ?? 0
  );

  // Si no está vencida o los días de retraso son 0
  if (!isOverdue || delayDays <= 0) {
    const staticArrears = Math.max(
      0,
      (installment.outstandingReceivablesArrears ?? 0)
    );
    return {
      delayDays: 0,
      rateUsed: installment.arrearsInterestRate || debt?.lateInterestRate || 0,
      accruedArrears: staticArrears,
      pendingArrears: staticArrears,
      pendingDeferment: defermentPending,
      totalPendingArrears: staticArrears + defermentPending,
    };
  }

  // Tasa de mora: prioridad a la cuota, luego a la deuda (lateInterestRate o interestRate como respaldo)
  const interestRate =
    installment.arrearsInterestRate ||
    debt?.lateInterestRate ||
    installment.interestRate ||
    debt?.interestRate ||
    0;

  const diasDelMes = debt?.daysPerMonth || 30;

  // Capital sobre el que corre la mora
  const capitalBase =
    installment.remainingCapitalToPay > 0
      ? installment.remainingCapitalToPay
      : (installment.capital || 0);

  let accruedArrears = 0;

  if (capitalBase > 0 && interestRate > 0) {
    try {
      accruedArrears = calculateInstallmentLateInterest({
        capital: capitalBase,
        interestRate,
        diasDelMes,
        delayDays,
      });
    } catch (e) {
      console.error("[calculateInstallmentArrears] Error en cálculo:", e);
      accruedArrears = 0;
    }
  }

  // Descontar lo pagado y lo pendiente por validar
  const dynamicPendingArrears = Math.max(
    0,
    accruedArrears -
      (installment.arrearsPaid ?? 0) -
      (installment.pendingArrears ?? 0)
  );

  // Si en la base de datos hay un saldo de mora mayor (ej. mora fija acordada), se respeta el mayor
  const finalPendingArrears = Math.round(
    Math.max(
      dynamicPendingArrears,
      installment.outstandingReceivablesArrears ?? 0
    )
  );

  return {
    delayDays,
    rateUsed: interestRate,
    accruedArrears: Math.round(accruedArrears),
    pendingArrears: finalPendingArrears,
    pendingDeferment: Math.round(defermentPending),
    totalPendingArrears: Math.round(finalPendingArrears + defermentPending),
  };
}
