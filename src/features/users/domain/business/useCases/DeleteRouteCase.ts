import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { UserGateway } from "../../infraestructure/UserGateway";
import type { setUserError } from "../entities/userErrors";

export interface DeleteRouteInput {
  userId: string;
  companyId: string;
  routeName: string;
}

export class DeleteRouteCase {
  private userGateway: UserGateway;

  constructor(userGateway: UserGateway) {
    this.userGateway = userGateway;
  }

  async execute(
    input: DeleteRouteInput
  ): Promise<Result<void, setUserError>> {
    const userResult = await this.userGateway.getById(input.userId);

    if (!userResult.ok || !userResult.value) {
      return fail({ code: "UNKNOWN_ERROR" });
    }

    const currentRoutes: Record<string, string[]> =
      userResult.value.collectorRoutes ?? {};

    const routeKey = input.routeName.trim();

    // Si no existe, éxito (idempotente)
    if (!currentRoutes[routeKey]) {
      return ok(undefined);
    }

    // Crear nuevo objeto sin la ruta eliminada
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [routeKey]: _, ...updatedRoutes } = currentRoutes;

    return this.userGateway.updateCollectorRoutes(
      input.userId,
      input.companyId,
      updatedRoutes
    );
  }
}
