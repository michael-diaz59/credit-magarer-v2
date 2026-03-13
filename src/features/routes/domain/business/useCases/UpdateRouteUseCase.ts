import type { Result } from "../../../../../core/helpers/ResultC";
import type { Route } from "../entities/Route";
import type { RouteError } from "../entities/routeErrors";
import type { RouteGateway } from "../../infraestructure/RouteGateway";

export interface UpdateRouteInput {
  route: Route;
}

export type UpdateRouteOutput = void;

export class UpdateRouteUseCase {
  private routeGateway: RouteGateway;

  constructor(routeGateway: RouteGateway) {
    this.routeGateway = routeGateway;
  }

  async execute(input: UpdateRouteInput): Promise<Result<UpdateRouteOutput, RouteError>> {
    return await this.routeGateway.updateRoute({ route: input.route });
  }
}
