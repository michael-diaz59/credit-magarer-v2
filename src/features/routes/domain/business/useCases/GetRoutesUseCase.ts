import type { Result } from "../../../../../core/helpers/ResultC";
import type { Route } from "../entities/Route";
import type { RouteError } from "../entities/routeErrors";
import type { RouteGateway } from "../../infraestructure/RouteGateway";

export interface GetRoutesInput {
  companyId: string;
}

export type GetRoutesOutput = Route[];

export class GetRoutesUseCase {
  private routeGateway: RouteGateway;

  constructor(routeGateway: RouteGateway) {
    this.routeGateway = routeGateway;
  }

  async execute(input: GetRoutesInput): Promise<Result<GetRoutesOutput, RouteError>> {
    return await this.routeGateway.getRoutesByCompany({ companyId: input.companyId });
  }
}
