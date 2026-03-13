import { CreateRouteUseCase } from "../business/useCases/CreateRouteUseCase";
import { GetRoutesUseCase } from "../business/useCases/GetRoutesUseCase";
import { UpdateRouteUseCase } from "../business/useCases/UpdateRouteUseCase";
import type { RouteGateway } from "./RouteGateway";
import { FirebaseRouteRepository } from "../../provider/firebase/FirebaseRouteRepository";

export class RouteOrchestrator {
  private routeGateway: RouteGateway;
  public createRouteUseCase: CreateRouteUseCase;
  public getRoutesUseCase: GetRoutesUseCase;
  public updateRouteUseCase: UpdateRouteUseCase;

  constructor() {
    this.routeGateway = new FirebaseRouteRepository();
    this.createRouteUseCase = new CreateRouteUseCase(this.routeGateway);
    this.getRoutesUseCase = new GetRoutesUseCase(this.routeGateway);
    this.updateRouteUseCase = new UpdateRouteUseCase(this.routeGateway);
  }
}

export const routeOrchestrator = new RouteOrchestrator();
