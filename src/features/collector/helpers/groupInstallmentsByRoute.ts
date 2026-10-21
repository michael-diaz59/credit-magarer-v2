import { IsFutureOrToday, IsPastDate } from "../../../core/helpers/dates/calculateDays";
import type { Installment } from "../../debits/domain/business/entities/Installment";
import type { Debt } from "../../debits/domain/business/entities/Debt";



export interface DebtGroupData {
  debtId: string;
  debtName: string;
  debt?: Debt;
  pending: Installment[];
  overdue: Installment[];
}

export interface CustomerGroupData {
  customerId: string;
  customerName: string;
  debts: Map<string, DebtGroupData>;
  pending: Installment[];
  overdue: Installment[];
}

export interface RouteGroupData {
  customers: Map<string, CustomerGroupData>;
}

export interface GroupedInstallments {
  routeGroups: Map<string, RouteGroupData>;
  unassigned: RouteGroupData;
}

export function groupInstallmentsByRoute(
  installments: Installment[],
  collectorRoutes?: Record<string, string[]>,
  debtNames?: Record<string, string>,
  debtsById?: Record<string, Debt>
): GroupedInstallments {
  const routeGroups = new Map<string, RouteGroupData>();
  const unassigned: RouteGroupData = { customers: new Map() };

  /* =========================
     1. Inicializar rutas
  ========================= */
  if (collectorRoutes) {
    for (const routeName of Object.keys(collectorRoutes)) {
      routeGroups.set(routeName, { customers: new Map() });
    }
  }

  /* =========================
     2. Mapa cliente → ruta
  ========================= */
  const customerToRoute = new Map<string, string>();
  if (collectorRoutes) {
    for (const [routeName, customers] of Object.entries(collectorRoutes)) {
      for (const customerId of customers) {
        customerToRoute.set(customerId, routeName);
      }
    }
  }

  /* =========================
     3. Clasificar cuotas por Ruta y Cliente
  ========================= */
  for (const installment of installments) {
    if (
      installment.status === "pagada" ||
      (installment.outstandingReceivables ?? installment.amount ?? 0) <= 0
    ) {
      continue;
    }

    const routeName = customerToRoute.get(installment.clientId);
    const targetRoute =
      routeName && routeGroups.has(routeName)
        ? routeGroups.get(routeName)!
        : unassigned;

    if (!targetRoute.customers.has(installment.clientId)) {
      targetRoute.customers.set(installment.clientId, {
        customerId: installment.clientId,
        customerName: installment.clientName,
        debts: new Map(),
        pending: [],
        overdue: [],
      });
    }

    const customerGroup = targetRoute.customers.get(installment.clientId)!;
    const debtId = installment.debtId || "sin_credito";

    if (!customerGroup.debts.has(debtId)) {
      const resolvedName =
        debtNames?.[debtId] ||
        installment.debtName ||
        (installment.debtId ? `Crédito #${installment.debtId.slice(-4).toUpperCase()}` : "Crédito");

      customerGroup.debts.set(debtId, {
        debtId,
        debtName: resolvedName,
        debt: debtsById?.[debtId],
        pending: [],
        overdue: [],
      });
    }

    const debtGroup = customerGroup.debts.get(debtId)!;
    const effectiveDate = installment.paymentDate || installment.dueDate;

    if (IsPastDate(effectiveDate)) {
      customerGroup.overdue.push(installment);
      debtGroup.overdue.push(installment);
    } else if (IsFutureOrToday(effectiveDate)) {
      customerGroup.pending.push(installment);
      debtGroup.pending.push(installment);
    }
  }

  /* =========================
     4. Ordenar cuotas de cada cliente y crédito cronológicamente
  ========================= */
  const sortInstallments = (a: Installment, b: Installment): number => {
    if (a.installmentNumber !== b.installmentNumber) {
      return a.installmentNumber - b.installmentNumber;
    }
    const dateA = new Date(a.paymentDate || a.dueDate).getTime();
    const dateB = new Date(b.paymentDate || b.dueDate).getTime();
    return dateA - dateB;
  };

  for (const route of [...routeGroups.values(), unassigned]) {
    for (const customer of route.customers.values()) {
      customer.pending.sort(sortInstallments);
      customer.overdue.sort(sortInstallments);
      for (const debt of customer.debts.values()) {
        debt.pending.sort(sortInstallments);
        debt.overdue.sort(sortInstallments);
      }
    }
  }

  return { routeGroups, unassigned };
}