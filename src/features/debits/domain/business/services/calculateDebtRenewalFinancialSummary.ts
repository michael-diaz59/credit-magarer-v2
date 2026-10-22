import type { Debt } from "../entities/Debt";
import type { Installment } from "../entities/Installment";
import { calculateDebtArrearsSummary } from "./calculateInstallmentArrears";

export interface DebtRenewalFinancialSummary {
  contractCapital: number;
  capitalPaid: number;
  capitalPending: number;

  contractInterest: number;
  interestPaid: number;
  interestPending: number;

  arrearsPaid: number;
  arrearsPending: number;

  defermentPaid: number;
  defermentPending: number;

  totalPaid: number;
  totalPending: number;
}

/**
 * Servicio de dominio para calcular la información financiera completa de un crédito
 * relevante para el flujo de renovación:
 * - Capital pactado, pagado y por pagar
 * - Intereses pactados, pagados y por pagar
 * - Mora (arrears) pagada y por pagar
 * - Aplazamiento (deferment) pagado y por pagar
 * - Totales consolidados pagados y pendientes
 */
export function calculateDebtRenewalFinancialSummary(
  debt?: Debt | null,
  installments: Installment[] = []
): DebtRenewalFinancialSummary {
  const contractCapital =
    debt?.capital ??
    installments.reduce((acc, curr) => acc + (curr.capital ?? 0), 0);

  const contractInterest =
    debt?.interest ??
    installments.reduce((acc, curr) => acc + (curr.interest ?? 0), 0);

  const capitalPaid =
    installments.length > 0
      ? installments.reduce((acc, curr) => acc + (curr.capitalPaid ?? 0), 0)
      : (debt?.capitalPaid ?? 0);

  const interestPaid =
    installments.length > 0
      ? installments.reduce((acc, curr) => acc + (curr.interestPaid ?? 0), 0)
      : (debt?.interestPaid ?? 0);

  const arrearsPaid =
    installments.length > 0
      ? installments.reduce((acc, curr) => acc + (curr.arrearsPaid ?? 0), 0)
      : (debt?.arrearsPaid ?? 0);

  const defermentPaid =
    installments.length > 0
      ? installments.reduce((acc, curr) => acc + (curr.defermentPaid ?? 0), 0)
      : (debt?.defermentPaid ?? 0);

  const capitalPending =
    installments.length > 0
      ? installments.reduce((acc, curr) => {
          const isPaid =
            curr.status === "pagada" ||
            (curr.outstandingReceivables !== undefined && curr.outstandingReceivables <= 0);
          if (isPaid) return acc;
          const pending =
            curr.remainingCapitalToPay > 0
              ? curr.remainingCapitalToPay
              : Math.max(0, (curr.capital ?? 0) - (curr.capitalPaid ?? 0));
          return acc + pending;
        }, 0)
      : (debt?.remainingCapitalToPay ?? Math.max(0, contractCapital - capitalPaid));

  const interestPending =
    installments.length > 0
      ? installments.reduce((acc, curr) => {
          const isPaid =
            curr.status === "pagada" ||
            (curr.outstandingReceivables !== undefined && curr.outstandingReceivables <= 0);
          if (isPaid) return acc;
          const pending =
            curr.remainingInterestToPay > 0
              ? curr.remainingInterestToPay
              : Math.max(0, (curr.interest ?? 0) - (curr.interestPaid ?? 0));
          return acc + pending;
        }, 0)
      : (debt?.remainingInterestToPay ?? Math.max(0, contractInterest - interestPaid));

  const arrearsSummary = calculateDebtArrearsSummary(installments, debt);
  const arrearsPending = arrearsSummary.totalDelayArrears;
  const defermentPending = arrearsSummary.totalDefermentArrears;

  const totalPaid =
    debt?.totalPaid && debt.totalPaid > 0
      ? debt.totalPaid
      : capitalPaid + interestPaid + arrearsPaid + defermentPaid;

  const totalPending = capitalPending + interestPending + arrearsPending + defermentPending;

  return {
    contractCapital,
    capitalPaid,
    capitalPending,
    contractInterest,
    interestPaid,
    interestPending,
    arrearsPaid,
    arrearsPending,
    defermentPaid,
    defermentPending,
    totalPaid,
    totalPending,
  };
}
