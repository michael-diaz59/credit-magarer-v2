import type { Installment } from "../../debits/domain/business/entities/Installment";
import {
  IsFutureOrToday,
  IsPastDate,
} from "../../../atomic_design/templates/recollector/RecolectorHome";

export interface RouteGroupData {
  pending: Installment[];
  overdue: Installment[];
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
  const unassigned: RouteGroupData = { pending: [], overdue: [] };

  /* =========================
     Inicializar rutas
  ========================= */

  if (collectorRoutes) {
    for (const routeName of Object.keys(collectorRoutes)) {
      routeGroups.set(routeName, { pending: [], overdue: [] });
    }
  }

  /* =========================
     Mapa cliente → ruta
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
     Clasificar cuotas
  ========================= */

  for (const installment of installments) {
    const routeName = customerToRoute.get(installment.costumerId);
    const targetGroup =
      routeName && routeGroups.has(routeName)
        ? routeGroups.get(routeName)!
        : unassigned;

    if (installment.status !== "pendiente") continue;

    if (IsFutureOrToday(installment.dueDate)) {
      targetGroup.pending.push(installment);
    } else if (IsPastDate(installment.dueDate)) {
      targetGroup.overdue.push(installment);
    }
  }

  return { routeGroups, unassigned };
}