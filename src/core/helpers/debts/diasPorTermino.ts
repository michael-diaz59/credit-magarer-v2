import type { DebtTerms } from "../../../features/debits/domain/business/entities/Debt";

/**dias que tiene el mas para cada modalidad */
export const diasDelMesPorTermino: Record<DebtTerms, number> = {
  diario: 24,
  semanal: 28,
  quincenal: 30,
  mensual: 30,
};

export const diasPorTermino: Record<DebtTerms, number> = {
  diario: 1,
  semanal: 7,
  quincenal: 15,
  mensual: 30,
};