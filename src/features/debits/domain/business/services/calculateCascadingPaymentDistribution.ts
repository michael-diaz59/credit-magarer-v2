import type { Debt } from "../entities/Debt";
import type { Installment } from "../entities/Installment";
import { cloneDebt } from "../entities/Debt";
import { cloneInstallment } from "../entities/Installment";
import { calculateInstallmentLateInterest } from "../useCases/helper";

export interface CascadingPaymentDistributionItem {
  installment: Installment;
  allocatedAmount: number;
  allocatedCapital: number;
  allocatedInterest: number;
  allocatedArrears: number;
  allocatedDeferment: number;
  totalAllocated: number;
  frozenArrears?: number;
}

export interface CascadingPaymentDistributionResult {
  debt: Debt;
  items: CascadingPaymentDistributionItem[];
  totalAmountAllocated: number;
  totalArrearsAllocated: number;
  unallocatedAmount: number;
  unallocatedArrears: number;
}

export interface CalculateCascadingPaymentParams {
  debt: Debt;
  allInstallments: Installment[];
  amountToPay: number;
  arrearsToPay: number;
  todayDateStr: string;
}

export function calculateCascadingPaymentDistribution(
  params: CalculateCascadingPaymentParams
): CascadingPaymentDistributionResult {
  const { debt, allInstallments, amountToPay, arrearsToPay, todayDateStr } = params;

  let remainingAmount = Math.max(0, amountToPay);
  let remainingArrears = Math.max(0, arrearsToPay);

  const today = new Date(`${todayDateStr}T00:00:00`);

  // Clona todas las cuotas y separa las que están vivas con saldo
  const clonedInstallments = allInstallments.map(cloneInstallment);
  const activeInstallments = clonedInstallments
    .filter((i) => i.isLife && (i.outstandingReceivables ?? 0) > 0)
    .sort((a, b) => a.installmentNumber - b.installmentNumber);

  let foundCurrentPeriod = false;
  const items: CascadingPaymentDistributionItem[] = [];

  let totalAmountAllocated = 0;
  let totalArrearsAllocated = 0;

  for (const item of activeInstallments) {
    if (remainingAmount <= 0 && remainingArrears <= 0) {
      break;
    }

    const itemDateStr = item.paymentDate || item.dueDate;
    const itemDate = new Date(`${itemDateStr}T00:00:00`);

    const isOverdue = itemDate <= today;
    const isBaseAlreadyPaid = (item.amountPaid ?? 0) >= item.amount;

    let isCurrentPeriod = false;
    let isFuture = false;

    if (!isOverdue) {
      if (!foundCurrentPeriod) {
        isCurrentPeriod = true;
        foundCurrentPeriod = true;
      } else {
        isFuture = true;
      }
    }

    // --- 1. CARRIL DE MORA Y APLAZAMIENTO ---
    let allocatedDeferment = 0;
    let allocatedArrears = 0;
    let frozenArrearsValue: number | undefined = undefined;

    if (remainingArrears > 0) {
      const maxDeferment = Math.min(
        item.outstandingReceivablesDeferment ?? (item.deferment ?? 0),
        Math.max(0, (item.deferment ?? 0) - (item.defermentPaid ?? 0))
      );
      if (maxDeferment > 0) {
        allocatedDeferment = Math.min(remainingArrears, maxDeferment);
        remainingArrears -= allocatedDeferment;
      }
    }

    if (remainingArrears > 0 && isOverdue) {

      // Calcular mora pendiente (congelada o dinámica)
      let pendingArrears = 0;
      if (isBaseAlreadyPaid) {
        pendingArrears = Math.max(0, (item.arrears ?? 0) - (item.arrearsPaid ?? 0) - (item.pendingArrears ?? 0));
      } else {
        const delayDays = Math.max(0, Math.floor((today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)));
        if (delayDays > 0) {
          const capitalBase = item.remainingCapitalToPay > 0 ? item.remainingCapitalToPay : item.capital;
          const calculatedLateInterest = calculateInstallmentLateInterest({
            capital: capitalBase,
            interestRate: item.arrearsInterestRate || debt.lateInterestRate || item.interestRate || debt.interestRate || 0,
            diasDelMes: debt.daysPerMonth || 30,
            delayDays,
          });
          pendingArrears = Math.max(
            0,
            calculatedLateInterest - (item.arrearsPaid ?? 0) - (item.pendingArrears ?? 0)
          );
        }
      }

      const maxArrears = Math.round(
        (item.outstandingReceivablesArrears ?? 0) > 0
          ? Math.max(pendingArrears, item.outstandingReceivablesArrears)
          : pendingArrears
      );

      if (remainingArrears > 0 && maxArrears > 0) {
        allocatedArrears = Math.min(remainingArrears, maxArrears);
        remainingArrears -= allocatedArrears;
      }
    }

    // --- 2. CARRIL DE MONTO BASE (CAPITAL + INTERÉS) ---
    let allocatedCapital = 0;
    let allocatedInterest = 0;

    if (remainingAmount > 0) {
      const pendingBase = Math.min(
        item.outstandingReceivablesAmount ?? item.amount,
        Math.max(0, (item.amount ?? 0) - (item.amountPaid ?? 0))
      );
      const pendingCapital = Math.max(0, (item.capital ?? 0) - (item.capitalPaid ?? 0));
      const pendingInterest = Math.max(0, (item.interest ?? 0) - (item.interestPaid ?? 0));

      if (isOverdue || isCurrentPeriod) {
        // En cuota vencida o en curso se amortiza capital e interés respetando el saldo pendiente por cobrar
        let allowedAmount = Math.min(remainingAmount, pendingBase);

        if (debt.type === "fijo") {
          allocatedCapital = Math.min(allowedAmount, pendingCapital);
          allowedAmount -= allocatedCapital;

          if (allowedAmount > 0) {
            allocatedInterest = Math.min(allowedAmount, pendingInterest);
            allowedAmount -= allocatedInterest;
          }
        } else {
          allocatedInterest = Math.min(allowedAmount, pendingInterest);
          allowedAmount -= allocatedInterest;

          if (allowedAmount > 0) {
            allocatedCapital = Math.min(allowedAmount, pendingCapital);
            allowedAmount -= allocatedCapital;
          }
        }
        remainingAmount -= (allocatedCapital + allocatedInterest);
      } else if (isFuture) {
        // En cuotas futuras se abona exclusivamente a capital
        const allowedFutureCapital = Math.min(
          item.outstandingReceivablesAmount ?? pendingCapital,
          pendingCapital
        );
        allocatedCapital = Math.min(remainingAmount, allowedFutureCapital);
        remainingAmount -= allocatedCapital;
        allocatedInterest = 0;
      }
    }

    const allocatedAmount = allocatedCapital + allocatedInterest;
    const totalAllocated = allocatedAmount + allocatedDeferment + allocatedArrears;

    if (totalAllocated > 0) {
      totalAmountAllocated += allocatedAmount;
      totalArrearsAllocated += allocatedDeferment + allocatedArrears;

      // --- 3. ACTUALIZAR ÚNICAMENTE SALDOS PENDIENTES POR COBRAR DE LA CUOTA ---
      // El cobrador solo modifica lo pendiente por cobrar. Los saldos pagados contables (capitalPaid, etc.)
      // y el cierre de la cuota (status: 'pagada', isLife: false) los realiza el contador tras la validación.
      const newOutstandingAmount = Math.max(0, (item.outstandingReceivablesAmount ?? item.amount) - allocatedAmount);
      const newOutstandingDeferment = Math.max(0, (item.outstandingReceivablesDeferment ?? item.deferment ?? 0) - allocatedDeferment);
      const newOutstandingArrears = Math.max(0, (item.outstandingReceivablesArrears ?? 0) - allocatedArrears);

      item.outstandingReceivablesAmount = newOutstandingAmount;
      item.outstandingReceivablesDeferment = newOutstandingDeferment;
      item.outstandingReceivablesArrears = newOutstandingArrears;
      item.outstandingReceivables =
        newOutstandingAmount + newOutstandingDeferment + newOutstandingArrears;

      items.push({
        installment: item,
        allocatedAmount,
        allocatedCapital,
        allocatedInterest,
        allocatedArrears,
        allocatedDeferment,
        totalAllocated,
        frozenArrears: frozenArrearsValue,
      });
    }
  }

  // --- 4. ACTUALIZAR ÚNICAMENTE SALDOS PENDIENTES POR COBRAR DE LA DEUDA GLOBAL ---
  const updatedDebt = cloneDebt(debt);
  let totalDebtOutstandingAmount = 0;
  let totalDebtOutstandingDeferment = 0;
  let totalDebtOutstandingArrears = 0;

  for (const inst of clonedInstallments) {
    totalDebtOutstandingAmount += inst.outstandingReceivablesAmount ?? 0;
    totalDebtOutstandingDeferment += inst.outstandingReceivablesDeferment ?? 0;
    totalDebtOutstandingArrears += inst.outstandingReceivablesArrears ?? 0;
  }

  updatedDebt.outstandingReceivablesAmount = totalDebtOutstandingAmount;
  updatedDebt.outstandingReceivablesDeferment = totalDebtOutstandingDeferment;
  updatedDebt.outstandingReceivablesArrears = totalDebtOutstandingArrears;
  updatedDebt.outstandingReceivables =
    totalDebtOutstandingAmount + totalDebtOutstandingDeferment + totalDebtOutstandingArrears;

  return {
    debt: updatedDebt,
    items,
    totalAmountAllocated,
    totalArrearsAllocated,
    unallocatedAmount: remainingAmount,
    unallocatedArrears: remainingArrears,
  };
}
