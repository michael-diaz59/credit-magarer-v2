import type { Debt, DebtTerms } from "../entities/Debt";
import type { Installment } from "../entities/Installment";

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getTermDays(term: DebtTerms): number {
  switch (term) {
    case "diario":
      return 1;
    case "semanal":
      return 7;
    case "quincenal":
      return 15;
    case "mensual":
      return 30;
    default:
      return 1;
  }
}

/**cada cuota se reodnde ahacia arriba al multiplo de 1000 mas cercano */
function roundUpToThousand(amount: number): number {
  if (amount <= 1000) return 1000;
  return Math.ceil(amount / 1000) * 1000;
}

export function generateInstallments(
  debt: Debt,
  costumerAddress: Installment["costumerAddres"]
): { installments: Installment[]; firstDueDate: string; nextPaymentDue: string; } {
  const installments: Installment[] = [];

  const baseAmount = debt.totalAmount / debt.installmentCount;
  const interestMultiplier = 1 + debt.interestRate / 100;

  const start = new Date(debt.startDate);
  const stepDays = getTermDays(debt.debtTerms);

  for (let i = 1; i <= debt.installmentCount; i++) {
    const dueDate = addDays(start, stepDays * i);

    const rawAmount = Number(
      (baseAmount * interestMultiplier).toFixed(2)
    );

    const roundedAmount = roundUpToThousand(rawAmount);

    installments.push({
      installmentTotalNumber: debt.installmentCount,
      originalInterestRate: debt.interestRate,
      paidAmount: 0,
      paidAt: "",



      id: crypto.randomUUID(),
      debtId: debt.id,
      collectorId: debt.collectorId,
      costumerId: debt.clientId,
      costumerDocument: debt.costumerDocument,
      costumerName: debt.costumerName,
      costumerAddres: costumerAddress,
      installmentNumber: i,
      interestRate: debt.interestRate,
      amount: roundedAmount,
      dueDate: dueDate.toISOString().slice(0, 10),
      status: "pendiente",
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }

  return {
    installments,
    firstDueDate: installments[0].dueDate,
    nextPaymentDue: installments[0].dueDate,
  };
}
