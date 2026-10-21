import type { Debt } from "../entities/Debt";
import type { Installment } from "../entities/Installment";
import { calculateInstallmentLateInterest } from "../useCases/helper";

export type InstallmentPeriodCategory = "vencida" | "en_curso" | "futura";

export interface InstallmentCapacityBreakdown {
  installmentId: string;
  installmentNumber: number;
  category: InstallmentPeriodCategory;
  isOverdue: boolean;
  baseAmountPending: number;
  defermentPending: number;
  dynamicArrears: number;
  totalDue: number;
  remainingCapital: number;
}

export interface DebtPaymentCapacity {
  debtId: string;
  /** Total a pagar hoy para quedar al día (cuotas vencidas o con fecha <= hoy) */
  dueTodayTotal: number;
  dueTodayBaseAmount: number;
  dueTodayArrears: number;
  dueTodayDeferment: number;
  overdueInstallmentsCount: number;

  /** Saldo de la cuota en curso inmediata (Capital + Interés) */
  currentPeriodInstallmentTotal: number;

  /** Suma exclusiva del capital de las cuotas futuras (sin intereses no causados) */
  futureInstallmentsCapitalOnly: number;

  /** Máximo permitido a abonar a la deuda sin exceder el capital + intereses causados + moras */
  maxPayableDebtTotal: number;

  breakdown: InstallmentCapacityBreakdown[];
}

export function calculateDebtPaymentCapacity(
  debt: Debt,
  allInstallments: Installment[],
  todayDateStr: string
): DebtPaymentCapacity {
  const activeInstallments = allInstallments
    .filter((i) => i.isLife && (i.outstandingReceivables ?? 0) > 0)
    .sort((a, b) => a.installmentNumber - b.installmentNumber);

  const today = new Date(`${todayDateStr}T00:00:00`);

  let dueTodayBase = 0;
  let dueTodayArrears = 0;
  let dueTodayDeferment = 0;
  let overdueCount = 0;

  let currentPeriodTotal = 0;
  let futureCapitalOnly = 0;

  let foundCurrentPeriod = false;

  const breakdown: InstallmentCapacityBreakdown[] = [];

  for (const item of activeInstallments) {
    const itemDateStr = item.paymentDate || item.dueDate;
    const itemDate = new Date(`${itemDateStr}T00:00:00`);

    const isOverdue = itemDate <= today;
    const isBasePaid = (item.amountPaid ?? 0) >= item.amount;

    let category: InstallmentPeriodCategory = "futura";
    let basePending = 0;
    let defermentPending = 0;
    let dynamicArrears = 0;
    const remainingCapital = Math.max(0, (item.capital ?? 0) - (item.capitalPaid ?? 0));

    if (isOverdue) {
      category = "vencida";
      overdueCount++;

      const officialBasePending = Math.max(0, (item.amount ?? 0) - (item.amountPaid ?? 0));
      basePending = Math.min(
        item.outstandingReceivablesAmount ?? officialBasePending,
        officialBasePending
      );

      const officialDefermentPending = Math.max(0, (item.deferment ?? 0) - (item.defermentPaid ?? 0));
      defermentPending = Math.min(
        item.outstandingReceivablesDeferment ?? officialDefermentPending,
        officialDefermentPending
      );

      if (isBasePaid) {
        // La cuota ya saldó su monto base: mora congelada
        dynamicArrears = Math.max(
          0,
          (item.arrears ?? 0) - (item.arrearsPaid ?? 0) - (item.pendingArrears ?? 0)
        );
      } else {
        // Devenga mora sobre el capital pendiente
        const delayDays = Math.max(0, Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)));
        if (delayDays > 0) {
          const capitalBase = item.remainingCapitalToPay > 0 ? item.remainingCapitalToPay : item.capital;
          const calculatedLateInterest = calculateInstallmentLateInterest({
            capital: capitalBase,
            interestRate: item.arrearsInterestRate || debt.lateInterestRate || item.interestRate || debt.interestRate || 0,
            diasDelMes: debt.daysPerMonth || 30,
            delayDays,
          });

          dynamicArrears = Math.max(
            0,
            calculatedLateInterest - (item.arrearsPaid ?? 0) - (item.pendingArrears ?? 0)
          );
        }
      }

      if ((item.outstandingReceivablesArrears ?? 0) > 0) {
        dynamicArrears = Math.max(dynamicArrears, item.outstandingReceivablesArrears);
      }
      dynamicArrears = Math.round(dynamicArrears);

      dueTodayBase += basePending;
      dueTodayDeferment += defermentPending;
      dueTodayArrears += dynamicArrears;
    } else if (!foundCurrentPeriod) {
      category = "en_curso";
      foundCurrentPeriod = true;

      // Paga monto base completo (capital + interés pactado)
      const officialBasePending = Math.max(0, (item.amount ?? 0) - (item.amountPaid ?? 0));
      basePending = Math.min(
        item.outstandingReceivablesAmount ?? officialBasePending,
        officialBasePending
      );
      currentPeriodTotal = basePending;
    } else {
      category = "futura";

      // Solo capital pendiente (se condonan intereses futuros si se paga por anticipado)
      basePending = Math.min(
        item.outstandingReceivablesAmount ?? remainingCapital,
        remainingCapital
      );
      futureCapitalOnly += basePending;
    }

    breakdown.push({
      installmentId: item.id,
      installmentNumber: item.installmentNumber,
      category,
      isOverdue,
      baseAmountPending: basePending,
      defermentPending,
      dynamicArrears,
      totalDue: basePending + defermentPending + dynamicArrears,
      remainingCapital,
    });
  }

  const totalArrears = Math.max(dueTodayArrears, debt.remainingArrearsToPay ?? 0);
  const totalDeferment = Math.max(dueTodayDeferment, debt.remainingDefermentToPay ?? 0);
  const dueTodayTotal = dueTodayBase + totalDeferment + totalArrears;
  const maxPayableDebtTotal = dueTodayTotal + currentPeriodTotal + futureCapitalOnly;

  return {
    debtId: debt.id,
    dueTodayTotal,
    dueTodayBaseAmount: dueTodayBase,
    dueTodayArrears: totalArrears,
    dueTodayDeferment: totalDeferment,
    overdueInstallmentsCount: overdueCount,
    currentPeriodInstallmentTotal: currentPeriodTotal,
    futureInstallmentsCapitalOnly: futureCapitalOnly,
    maxPayableDebtTotal,
    breakdown,
  };
}
