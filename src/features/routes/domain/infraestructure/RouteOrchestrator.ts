import { CreateRouteUseCase } from "../business/useCases/CreateRouteUseCase";
import { GetRoutesUseCase } from "../business/useCases/GetRoutesUseCase";
import { UpdateRouteUseCase } from "../business/useCases/UpdateRouteUseCase";
import { AssignRouteCollectorUseCase } from "../business/useCases/AssignRouteCollectorUseCase";
import type { RouteGateway } from "./RouteGateway";
import { FirebaseRouteRepository } from "../../provider/firebase/FirebaseRouteRepository";
import { FirebaseUserRepository } from "../../../users/provider/firebase/FirebaseUserRepository";

export class RouteOrchestrator {
  private routeGateway: RouteGateway;
  public createRouteUseCase: CreateRouteUseCase;
  public getRoutesUseCase: GetRoutesUseCase;
  public updateRouteUseCase: UpdateRouteUseCase;
  public assignRouteCollectorUseCase: AssignRouteCollectorUseCase;

  constructor() {
    this.routeGateway = new FirebaseRouteRepository();
    this.createRouteUseCase = new CreateRouteUseCase(this.routeGateway);
    this.getRoutesUseCase = new GetRoutesUseCase(this.routeGateway);
    this.updateRouteUseCase = new UpdateRouteUseCase(this.routeGateway);
    
    // We instantiate the UserGateway here exclusively for the cross-domain AssignRouteCollectorUseCase
    const userGateway = new FirebaseUserRepository();
    this.assignRouteCollectorUseCase = new AssignRouteCollectorUseCase(this.routeGateway, userGateway);
  }
}

export const routeOrchestrator = new RouteOrchestrator();
