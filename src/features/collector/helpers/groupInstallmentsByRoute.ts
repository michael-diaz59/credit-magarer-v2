import type { Installment } from "../../debits/domain/business/entities/Installment";
import {
  IsFutureOrToday,
  IsPastDate,
} from "../../../atomic_design/templates/recollector/RecolectorHome";

export interface CustomerGroupData {
  customerId: string;
  customerName: string;
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
  collectorRoutes?: Record<string, string[]>
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
     3. Filtrar Cuotas (solo la más vieja por deuda)
  ========================= */
  const oldestInstallmentsByDebt = new Map<string, Installment>();

  for (const installment of installments) {
    if (installment.status !== "pendiente" && installment.status !== "incompleto") continue;

    const currentOldest = oldestInstallmentsByDebt.get(installment.debtId);

    if (!currentOldest || new Date(installment.dueDate) < new Date(currentOldest.dueDate)) {
      oldestInstallmentsByDebt.set(installment.debtId, installment);
    }
  }

  /* =========================
     4. Clasificar cuotas filtradas por Ruta y Cliente
  ========================= */
  for (const installment of oldestInstallmentsByDebt.values()) {
    const routeName = customerToRoute.get(installment.costumerId);
    const targetRoute =
      routeName && routeGroups.has(routeName)
        ? routeGroups.get(routeName)!
        : unassigned;

    if (!targetRoute.customers.has(installment.costumerId)) {
      targetRoute.customers.set(installment.costumerId, {
        customerId: installment.costumerId,
        customerName: installment.costumerName,
        pending: [],
        overdue: [],
      });
    }

    const customerGroup = targetRoute.customers.get(installment.costumerId)!;

    if (IsFutureOrToday(installment.dueDate)) {
      customerGroup.pending.push(installment);
    } else if (IsPastDate(installment.dueDate)) {
      customerGroup.overdue.push(installment);
    }
  }

  return { routeGroups, unassigned };
}