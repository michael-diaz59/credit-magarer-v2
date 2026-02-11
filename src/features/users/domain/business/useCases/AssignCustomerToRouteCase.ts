import { fail, type Result } from "../../../../../core/helpers/ResultC";
import type { UserGateway } from "../../infraestructure/UserGateway";
import type { setUserError } from "../entities/userErrors";

export interface AssignCustomerToRouteInput {
  userId: string;
  companyId: string;
  routeName: string;
  customerId: string;
}

export class AssignCustomerToRouteCase {
  private userGateway: UserGateway;

  constructor(userGateway: UserGateway) {
    this.userGateway = userGateway;
  }

  async execute(
    input: AssignCustomerToRouteInput
  ): Promise<Result<void, setUserError>> {
    const userResult = await this.userGateway.getById(input.userId);

    if (!userResult.ok || !userResult.value) {
      return fail({ code: "UNKNOWN_ERROR" });
    }

    const currentRoutes: Record<string, string[]> =
      userResult.value.collectorRoutes ?? {};

    // 1. Normalizar nombre de ruta (opcional pero recomendado)
    const routeKey = input.routeName.trim();

    // 2. Limpiar al cliente de TODAS las rutas
    const cleanedRoutes: Record<string, string[]> = Object.fromEntries(
      Object.entries(currentRoutes).map(([route, customers]) => [
        route,
        customers.filter(id => id !== input.customerId),
      ])
    );

    // 3. Asegurar que la ruta destino exista
    const destinationCustomers =
      cleanedRoutes[routeKey] ?? [];

    // 4. Agregar cliente a la ruta destino (sin duplicar)
    const updatedRoutes: Record<string, string[]> = {
      ...cleanedRoutes,
      [routeKey]: [...destinationCustomers, input.customerId],
    };

    // 5. Guardar
    return this.userGateway.updateCollectorRoutes(
      input.userId,
      input.companyId,
      updatedRoutes
    );
  }
}
