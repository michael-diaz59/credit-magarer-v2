import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { UserGateway } from "../../infraestructure/UserGateway";
import type { setUserError } from "../entities/userErrors";

export interface UnassignCustomerFromRouteInput {
  userId: string;
  companyId: string;
  routeName: string;
  customerId: string;
}

export class UnassignCustomerFromRouteCase {
  private userGateway: UserGateway;

  constructor(userGateway: UserGateway) {
    this.userGateway = userGateway;
  }

  async execute(
    input: UnassignCustomerFromRouteInput
  ): Promise<Result<void, setUserError>> {
    const userResult = await this.userGateway.getById(input.userId);

    if (!userResult.ok || !userResult.value) {
      return fail({ code: "UNKNOWN_ERROR" });
    }

    const currentRoutes: Record<string, string[]> =
      userResult.value.collectorRoutes ?? {};

    const routeKey = input.routeName.trim();

    // Si la ruta no existe, éxito (idempotente)
    if (!currentRoutes[routeKey]) {
      return ok(undefined);
    }

    const updatedCustomers = currentRoutes[routeKey].filter(
      id => id !== input.customerId
    );

    // Si no hubo cambios, éxito
    if (updatedCustomers.length === currentRoutes[routeKey].length) {
      return ok(undefined);
    }

    const updatedRoutes: Record<string, string[]> = {
      ...currentRoutes,
      [routeKey]: updatedCustomers,
    };

    return this.userGateway.updateCollectorRoutes(
      input.userId,
      input.companyId,
      updatedRoutes
    );
  }
}
