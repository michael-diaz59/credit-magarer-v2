import type { Result } from "../../../../../core/helpers/ResultC";
import type { Route } from "../entities/Route";
import type { RouteError } from "../entities/routeErrors";
import type { RouteGateway } from "../../infraestructure/RouteGateway";

export interface CreateRouteInput {
  route: Route;
}

export type CreateRouteOutput = void;

export class CreateRouteUseCase {
  private routeGateway: RouteGateway;

  constructor(routeGateway: RouteGateway) {
    this.routeGateway = routeGateway;
  }

  async execute(input: CreateRouteInput): Promise<Result<CreateRouteOutput, RouteError>> {
    return await this.routeGateway.createRoute({ route: input.route });
  }
}
