
import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { UserGateway } from "../../infraestructure/UserGateway";
import type { setUserError } from "../entities/userErrors";

export interface AddRouteInput {
  userId: string;
  companyId: string;
  routeName: string;
}

export class AddRouteCase {
  private userGateway: UserGateway;

  constructor(userGateway: UserGateway) {
    this.userGateway = userGateway;
  }

  async execute(input: AddRouteInput): Promise<Result<void, setUserError>> {
    // 1. Obtener usuario
    const userResult = await this.userGateway.getById(input.userId);

    if (!userResult.ok || !userResult.value) {
      return fail({ code: "UNKNOWN_ERROR" });
    }

    const user = userResult.value;

    // 👇 ahora es Record, no Map
    const currentRoutes: Record<string, string[]> =
      user.collectorRoutes ?? {};

    // 2. Validar si ya existe (idempotente)
    if (currentRoutes[input.routeName]) {
      return ok(undefined);
    }

    // 3. Crear NUEVO objeto (inmutabilidad)
    const updatedRoutes: Record<string, string[]> = {
      ...currentRoutes,
      [input.routeName]: [],
    };

    // 4. Guardar
    return this.userGateway.updateCollectorRoutes(
      input.userId,
      input.companyId,
      updatedRoutes
    );
  }
}