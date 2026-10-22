import type { Installment } from "../entities/Installment";
import type { Debt } from "../entities/Debt";
import { calculateInstallmentLateInterest } from "../useCases/helper";

export interface CalculateInstallmentArrearsParams {
  installment: Installment;
  debt?: Debt | null;
  referenceDate?: string | Date;
}

export interface InstallmentArrearsResult {
  delayDays: number;
  rateUsed: number;
  accruedArrears: number;
  pendingArrears: number;
  pendingDeferment: number;
  totalPendingArrears: number;
}

export interface DebtArrearsSummary {
  totalDelayArrears: number;
  totalDefermentArrears: number;
  totalArrears: number;
  overdueInstallmentsCount: number;
}

/**
 * Normaliza una fecha (string o Date) a un objeto Date a medianoche (00:00:00) en hora local,
 * eliminando cualquier desfase por interpretación UTC.
 */
export function normalizeDateToLocalMidnight(dateInput?: string | Date | null): Date {
  if (!dateInput) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }
  if (dateInput instanceof Date) {
    const d = new Date(dateInput);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const dateStr = String(dateInput).split("T")[0].trim();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }
  const fallback = new Date(dateInput);
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

/**
 * Calcula dinámicamente la mora acumulada y pendiente por cobrar de una cuota,
 * considerando los días de retraso respecto a la fecha efectiva (paymentDate || dueDate).
 * Esta es la fuente única de verdad para el cálculo de mora en todo el sistema.
 */
export function calculateInstallmentArrears({
  installment,
  debt,
  referenceDate,
}: CalculateInstallmentArrearsParams): InstallmentArrearsResult {
  const defermentPending = Math.round(
    Math.max(
      0,
      (installment.deferment ?? 0) -
        (installment.defermentPaid ?? 0) -
        (installment.pendingDeferment ?? 0),
      installment.outstandingReceivablesDeferment ?? 0,
      installment.remainingDefermentToPay ?? 0
    )
  );

  // Cuotas pagadas no devengan mora
  const isPaid =
    installment.status === "pagada" ||
    (installment.outstandingReceivables !== undefined && installment.outstandingReceivables <= 0);

  if (isPaid) {
    return {
      delayDays: 0,
      rateUsed: 0,
      accruedArrears: 0,
      pendingArrears: 0,
      pendingDeferment: defermentPending,
      totalPendingArrears: defermentPending,
    };
  }

  const effectiveDateStr = installment.paymentDate || installment.dueDate;
  const today = normalizeDateToLocalMidnight(referenceDate);

  let delayDays = 0;
  let isOverdue = false;

  if (effectiveDateStr) {
    const itemDate = normalizeDateToLocalMidnight(effectiveDateStr);
    const diffTime = today.getTime() - itemDate.getTime();
    delayDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    isOverdue = itemDate < today;
  }

  const interestRate =
    installment.arrearsInterestRate ||
    debt?.lateInterestRate ||
    installment.interestRate ||
    debt?.interestRate ||
    0;

  // Si no está vencida o los días de retraso son 0
  if (!isOverdue || delayDays <= 0) {
    const staticArrears = Math.max(
      0,
      installment.outstandingReceivablesArrears ?? 0
    );
    return {
      delayDays: 0,
      rateUsed: interestRate,
      accruedArrears: staticArrears,
      pendingArrears: staticArrears,
      pendingDeferment: defermentPending,
      totalPendingArrears: Math.round(staticArrears + defermentPending),
    };
  }

  const isBasePaid = (installment.amountPaid ?? 0) >= (installment.amount || 0);
  let dynamicArrears = 0;

  if (isBasePaid) {
    // Si la cuota ya pagó su monto base, la mora queda congelada
    dynamicArrears = Math.max(
      0,
      (installment.arrears ?? 0) -
        (installment.arrearsPaid ?? 0) -
        (installment.pendingArrears ?? 0)
    );
  } else {
    // Devenga mora sobre el capital pendiente
    const capitalBase =
      installment.remainingCapitalToPay > 0
        ? installment.remainingCapitalToPay
        : installment.capitalPaid && installment.capitalPaid > 0
        ? Math.max(0, (installment.capital || 0) - installment.capitalPaid)
        : (installment.capital || 0);

    const diasDelMes = debt?.daysPerMonth || 30;

    if (capitalBase > 0 && interestRate > 0) {
      try {
        const calculatedLateInterest = calculateInstallmentLateInterest({
          capital: capitalBase,
          interestRate,
          diasDelMes,
          delayDays,
        });

        dynamicArrears = Math.max(
          0,
          calculatedLateInterest -
            (installment.arrearsPaid ?? 0) -
            (installment.pendingArrears ?? 0)
        );
      } catch (e) {
        console.error("[calculateInstallmentArrears] Error en cálculo:", e);
        dynamicArrears = 0;
      }
    }
  }

  const finalPendingArrears = Math.round(
    Math.max(
      dynamicArrears,
      installment.outstandingReceivablesArrears ?? 0
    )
  );

  return {
    delayDays,
    rateUsed: interestRate,
    accruedArrears: finalPendingArrears + (installment.arrearsPaid ?? 0),
    pendingArrears: finalPendingArrears,
    pendingDeferment: defermentPending,
    totalPendingArrears: Math.round(finalPendingArrears + defermentPending),
  };
}

/**
 * Calcula el resumen total consolidado de mora y aplazamiento de un crédito a partir de sus cuotas.
 */
export function calculateDebtArrearsSummary(
  installments: Installment[],
  debt?: Debt | null,
  referenceDate?: string | Date
): DebtArrearsSummary {
  let totalDelayArrears = 0;
  let totalDefermentArrears = 0;
  let overdueInstallmentsCount = 0;

  for (const inst of installments) {
    if (
      inst.status === "pagada" ||
      (inst.outstandingReceivables !== undefined && inst.outstandingReceivables <= 0)
    ) {
      continue;
    }

    const arrearsInfo = calculateInstallmentArrears({
      installment: inst,
      debt,
      referenceDate,
    });

    if (arrearsInfo.delayDays > 0) {
      overdueInstallmentsCount++;
    }

    totalDelayArrears += arrearsInfo.pendingArrears;
    totalDefermentArrears += arrearsInfo.pendingDeferment;
  }

  const finalDelayArrears = Math.max(totalDelayArrears, debt?.remainingArrearsToPay ?? 0);
  const finalDefermentArrears = Math.max(totalDefermentArrears, debt?.remainingDefermentToPay ?? 0);

  return {
    totalDelayArrears: finalDelayArrears,
    totalDefermentArrears: finalDefermentArrears,
    totalArrears: finalDelayArrears + finalDefermentArrears,
    overdueInstallmentsCount,
  };
}
