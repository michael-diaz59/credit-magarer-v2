import type { Result } from "../../../../core/helpers/ResultC";
import type { Route } from "../business/entities/Route";
import type { RouteError } from "../business/entities/routeErrors";

export interface CreateRouteGatewayInput {
  route: Route;
}

export interface GetRoutesGatewayInput {
  companyId: string;
}

export interface UpdateRouteGatewayInput {
  route: Route; // Solo actualizaremos name y description
}

export interface RouteGateway {
  createRoute(input: CreateRouteGatewayInput): Promise<Result<void, RouteError>>;
  getRoutesByCompany(input: GetRoutesGatewayInput): Promise<Result<Route[], RouteError>>;
  updateRoute(input: UpdateRouteGatewayInput): Promise<Result<void, RouteError>>;
  updateBalance(input: { companyId: string, routeId: string, amount: number }): Promise<Result<void, any>>;
}
