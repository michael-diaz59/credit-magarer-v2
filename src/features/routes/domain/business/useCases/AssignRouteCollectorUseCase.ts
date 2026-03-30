import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { RouteGateway } from "../../infraestructure/RouteGateway";
import type { UserGateway } from "../../../../users/domain/infraestructure/UserGateway";
import type { RouteError } from "../entities/routeErrors";
import type { Route } from "../entities/Route";

export interface AssignRouteCollectorInput {
  route: Route;
  newCobradorId?: string;
  oldCobradorId?: string;
  companyId: string;
}

export type AssignRouteCollectorOutput = void;

export class AssignRouteCollectorUseCase {
  private routeGateway: RouteGateway;
  private userGateway: UserGateway;

  constructor(routeGateway: RouteGateway, userGateway: UserGateway) {
    this.routeGateway = routeGateway;
    this.userGateway = userGateway;
  }

  async execute(input: AssignRouteCollectorInput): Promise<Result<AssignRouteCollectorOutput, RouteError>> {
    const { route, newCobradorId, oldCobradorId, companyId } = input;

    // 1. Actualizar la entidad Route
    const updatedRoute: Route = { ...route, cobradorId: newCobradorId };
    const routeUpdateResult = await this.routeGateway.updateRoute({ route: updatedRoute });

    if (!routeUpdateResult.ok) {
      return fail(routeUpdateResult.error);
    }

    // 2. Remover la ruta del cobrador anterior si existe y es diferente al nuevo
    if (oldCobradorId && oldCobradorId !== newCobradorId) {
      const oldUserResult = await this.userGateway.getById(oldCobradorId);
      if (oldUserResult.ok && oldUserResult.value) {
        const currentUserRoutes = oldUserResult.value.idRoutes || [];
        const filteredRoutes = currentUserRoutes.filter(id => id !== route.id);
        
        await this.userGateway.updateUserRoutes(
          oldCobradorId, 
          companyId, 
          filteredRoutes
        );
      }
    }

    // 3. Añadir la ruta al nuevo cobrador si existe y es diferente al anterior
    if (newCobradorId && newCobradorId !== oldCobradorId) {
      const newUserResult = await this.userGateway.getById(newCobradorId);
      if (newUserResult.ok && newUserResult.value) {
        const currentUserRoutes = newUserResult.value.idRoutes || [];
        if (!currentUserRoutes.includes(route.id)) {
          const updatedRoutes = [...currentUserRoutes, route.id];
          await this.userGateway.updateUserRoutes(
            newCobradorId, 
            companyId, 
            updatedRoutes
          );
        }
      }
    }

    return ok(undefined);
  }
}
