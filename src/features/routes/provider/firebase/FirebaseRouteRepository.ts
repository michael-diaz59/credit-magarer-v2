import { collection, doc, getDocs, query, setDoc, increment, getDoc, type DocumentData } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";
import type { RouteGateway, CreateRouteGatewayInput, GetRoutesGatewayInput, UpdateRouteGatewayInput } from "../../domain/infraestructure/RouteGateway";
import type { Route, CashBalances, DepositBalances } from "../../domain/business/entities/Route";
import type { RouteError } from "../../domain/business/entities/routeErrors";

export class FirebaseRouteRepository implements RouteGateway {

  private documentToRoute(id: string, data: DocumentData): Route {
    return {
      id: id,
      name: data.name,
      description: data.description,
      companyId: data.companyId,
      startDisabled: data.startDisabled ?? undefined,
      endDisabled: data.endDisabled ?? undefined,
      cobradorId: data.cobradorId ?? undefined,
      totalCash: data.totalCollected ?? 0,
      totalCash2: data.totalCash2 ?? [],
      totalDeposit: data.totalDeposit ?? [],
    } as Route;
  }

  private routeToDocument(route: Route): DocumentData {
    const data: DocumentData = {};
    data.name = route.name;
    data.description = route.description;
    data.companyId = route.companyId;
    data.startDisabled = route.startDisabled ?? null;
    data.endDisabled = route.endDisabled ?? null;
    data.cobradorId = route.cobradorId ?? null;
    data.totalCollected = route.totalCash ?? 0;
    data.totalCash2 = route.totalCash2 ?? [];
    data.totalDeposit = route.totalDeposit ?? [];

    return data;
  }

  async createRoute(input: CreateRouteGatewayInput): Promise<Result<void, RouteError>> {
    try {
      const companyId = input.route.companyId;
      // Si el id viene vacío o undefined, le asignamos uno autogenerado
      const refRoutesColl = collection(firestore, "companies", companyId, "routes");
      const refRoute = input.route.id ? doc(refRoutesColl, input.route.id) : doc(refRoutesColl);

      const routeData = this.routeToDocument({
        ...input.route,
        id: refRoute.id,
      });

      await setDoc(refRoute, routeData, { merge: true });

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

      const routes: Route[] = snapshot.docs.map((doc) => this.documentToRoute(doc.id, doc.data()));
      console.log("routes", routes);

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

      const routeData = this.routeToDocument({
        companyId: input.route.companyId,
        id: input.route.id,
        name: input.route.name,
        description: input.route.description,
        startDisabled: input.route.startDisabled,
        endDisabled: input.route.endDisabled,
        cobradorId: input.route.cobradorId,
      });

      await setDoc(refRoute, routeData, { merge: true });

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

  async updateBalance(input: { companyId: string, routeId: string, amount: number }): Promise<Result<void, any>> {
    try {
      const { companyId, routeId, amount } = input;
      const refRoute = doc(firestore, "companies", companyId, "routes", routeId);

      await setDoc(refRoute, {
        totalCollected: increment(amount),
        id: routeId,
        name: routeId === "default" ? "Registros sin ruta" : (routeId), // Temporary name if creating
        companyId: companyId
      }, { merge: true });

      return ok(undefined);
    } catch (error) {
      console.error("[updateBalance]", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }

  async updateSpecificBalances(input: {
    companyId: string,
    routeId: string,
    cashEntries: CashBalances[],
    depositEntries: DepositBalances[]
  }): Promise<Result<void, any>> {
    try {
      const { companyId, routeId, cashEntries, depositEntries } = input;
      const refRoute = doc(firestore, "companies", companyId, "routes", routeId);

      // Leemos primero la ruta actual para actualizar los arrays
      const snapshot = await getDoc(refRoute);
      let currentCash2: CashBalances[] = [];
      let currentDeposit: DepositBalances[] = [];
      let currentTotalCollected = 0;

      if (snapshot.exists()) {
        const data = snapshot.data();
        currentCash2 = data.totalCash2 ?? [];
        currentDeposit = data.totalDeposit ?? [];
        currentTotalCollected = data.totalCollected ?? 0;
      }

      // Actualizar saldos en efectivo
      for (const entry of cashEntries) {
        const existing = currentCash2.find(c => c.collectorId === entry.collectorId);
        if (existing) {
          existing.amount += entry.amount;
        } else {
          currentCash2.push({ ...entry });
        }
        currentTotalCollected += entry.amount;
      }

      // Actualizar depósitos
      for (const entry of depositEntries) {
        const existing = currentDeposit.find(d => d.bankAccountId === entry.bankAccountId);
        if (existing) {
          existing.amount += entry.amount;
        } else {
          currentDeposit.push({ ...entry });
        }
        currentTotalCollected += entry.amount;
      }

      await setDoc(refRoute, {
        totalCash2: currentCash2,
        totalDeposit: currentDeposit,
        totalCollected: currentTotalCollected, // Mantenemos este por retrocompatibilidad
        id: routeId,
        companyId: companyId
      }, { merge: true });

      return ok(undefined);
    } catch (error) {
      console.error("[updateSpecificBalances]", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }
}
