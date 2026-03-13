import { collection, doc, getDocs, query, setDoc } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";
import type { RouteGateway, CreateRouteGatewayInput, GetRoutesGatewayInput, UpdateRouteGatewayInput } from "../../domain/infraestructure/RouteGateway";
import type { Route } from "../../domain/business/entities/Route";
import type { RouteError } from "../../domain/business/entities/routeErrors";

export class FirebaseRouteRepository implements RouteGateway {
  
  async createRoute(input: CreateRouteGatewayInput): Promise<Result<void, RouteError>> {
    try {
      const companyId = input.route.companyId;
      // Si el id viene vacío o undefined, le asignamos uno autogenerado
      const refRoutesColl = collection(firestore, "companies", companyId, "routes");
      const refRoute = input.route.id ? doc(refRoutesColl, input.route.id) : doc(refRoutesColl);
      
      await setDoc(refRoute, {
        id: refRoute.id,
        name: input.route.name,
        description: input.route.description,
        companyId: companyId,
        startDisabled: input.route.startDisabled ?? null,
        endDisabled: input.route.endDisabled ?? null,
      }, { merge: true });

      return ok(undefined);
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "permission-denied":
            return fail({ code: "NETWORK_ERROR", message: "Permiso denegado" });
          case "unavailable":
            return fail({ code: "NETWORK_ERROR", message: "Servicio no disponible" });
        }
      }
      return fail({ code: "UNKNOWN_ERROR", message: "Error desconocido al crear la ruta" });
    }
  }

  async getRoutesByCompany(input: GetRoutesGatewayInput): Promise<Result<Route[], RouteError>> {
    try {
      const refRoutes = collection(firestore, "companies", input.companyId, "routes");
      const routesQuery = query(refRoutes);
      const snapshot = await getDocs(routesQuery);

      const routes: Route[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          companyId: data.companyId,
          startDisabled: data.startDisabled ?? undefined,
          endDisabled: data.endDisabled ?? undefined,
        } as Route;
      });

      return ok(routes);
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "permission-denied":
          case "unavailable":
            return fail({ code: "NETWORK_ERROR" });
        }
      }
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }

  async updateRoute(input: UpdateRouteGatewayInput): Promise<Result<void, RouteError>> {
    try {
      const companyId = input.route.companyId;
      const refRoute = doc(firestore, "companies", companyId, "routes", input.route.id);
      
      await setDoc(refRoute, {
        name: input.route.name,
        description: input.route.description,
        startDisabled: input.route.startDisabled ?? null,
        endDisabled: input.route.endDisabled ?? null,
      }, { merge: true });

      return ok(undefined);
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "permission-denied":
            return fail({ code: "NETWORK_ERROR", message: "Permiso denegado" });
          case "unavailable":
            return fail({ code: "NETWORK_ERROR", message: "Servicio no disponible" });
        }
      }
      return fail({ code: "UNKNOWN_ERROR", message: "Error desconocido al actualizar la ruta" });
    }
  }
}
