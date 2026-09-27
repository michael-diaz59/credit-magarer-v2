import { collection, doc, getDocs, query, setDoc, increment, type DocumentData, writeBatch, where, getAggregateFromServer, sum } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";
import type { RouteGateway, CreateRouteGatewayInput, GetRoutesGatewayInput, UpdateRouteGatewayInput } from "../../domain/infraestructure/RouteGateway";
import type { Route } from "../../domain/business/entities/Route";
import type { RouteError } from "../../domain/business/entities/routeErrors";
import type { PutMoneyToRoutesError, PutMoneyToRoutesInput, PutMoneyToRoutesOutput } from "../../domain/business/useCases/PutMoneyToRoutesCase";

export class FirebaseRouteRepository implements RouteGateway {


  async createRoute(input: CreateRouteGatewayInput): Promise<Result<void, RouteError>> {
    try {
      const companyId = input.route.companyId;
      // Si el id viene vacío o undefined, le asignamos uno autogenerado
      const refRoutesColl = collection(firestore, "companies", companyId, "routes");
      const refRoute = input.route.id ? doc(refRoutesColl, input.route.id) : doc(refRoutesColl);

      const routeData = routeToDocument({
        ...input.route,
        id: refRoute.id,
      });

      await setDoc(refRoute, routeData, { merge: true });

      return ok(undefined);
    } catch (error) {
      console.error("[CreateRouteRepository]", error);
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

  async getBalancesByRoute(
    companyId: string,
    routes: Route[],
  ): Promise<Route[]> {
    try {
      if (routes.length === 0) {
        return routes;
      }

      const refRoutes = collection(
        firestore,
        "companies",
        companyId,
        "routes",
      );

      const balances = new Map<
        string,
        {
          cashBalances: number;
          depositBalances: number;
        }
      >();

      // Inicializamos todos los balances
      for (const route of routes) {
        balances.set(route.id, {
          cashBalances: 0,
          depositBalances: 0,
        });
      }

      // Ejecutamos las rutas en paralelo
      await Promise.all(
        routes.map(async (route) => {
          const cashQuery = query(
            refRoutes,
            where("status", "==", "confirmado"),
            where("method", "==", "efectivo"),
            where("idRoute", "==", route.id),
          );

          const depositQuery = query(
            refRoutes,
            where("status", "==", "confirmado"),
            where("method", "==", "consignacion"),
            where("idRoute", "==", route.id),
          );

          const [
            cashSnapshot,
            depositSnapshot,
          ] = await Promise.all([
            getAggregateFromServer(cashQuery, {
              amount: sum("amount"),
            }),

            getAggregateFromServer(depositQuery, {
              amount: sum("amount"),
            }),
          ]);

          const balance = balances.get(route.id);

          if (!balance) {
            return;
          }

          balance.cashBalances =
            cashSnapshot.data().amount ?? 0;

          balance.depositBalances =
            depositSnapshot.data().amount ?? 0;
        }),
      );

      return routes.map((route) => {
        const balance = balances.get(route.id);

        return {
          ...route,
          cashBalances: balance?.cashBalances ?? 0,
          depositBalances: balance?.depositBalances ?? 0,
        };
      });
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getRoutesByCompany(input: GetRoutesGatewayInput): Promise<Result<Route[], RouteError>> {
    try {
      const refRoutes = collection(firestore, "companies", input.companyId, "routes");
      const routesQuery = query(refRoutes);
      const snapshot = await getDocs(routesQuery);

      const routes: Route[] = snapshot.docs.map((doc) => documentToRoute(doc.id, doc.data(), 0, 0));
      const routesWithBalances = await this.getBalancesByRoute(input.companyId, routes);

      return ok(routesWithBalances);
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

      const routeData = routeToDocument(input.route);

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

  async UpdateDepositBalances(input: {
    companyId: string,
    routeId: string,
    BankAccountId: string,
  }) {
    const { companyId, routeId } = input;
    try {
      const refRoute = doc(firestore, "companies", companyId, "routes", routeId,);
      console.log("refRoute", refRoute);

    } catch {

    }

  }

  async PutMoneyToRoutes(input: PutMoneyToRoutesInput): Promise<Result<PutMoneyToRoutesOutput, PutMoneyToRoutesError>> {
    try {
      const CHUNK_SIZE = 200; // Dividir los movimientos en chunks

      for (let i = 0; i < input.putMoneyToRoutes.length; i += CHUNK_SIZE) {
        const chunk = input.putMoneyToRoutes.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(firestore);

        for (const putMoneyToRoute of chunk) {
          const routeRef = doc(
            firestore,
            "companies",
            putMoneyToRoute.companyId,
            "routes",
            putMoneyToRoute.routeId
          );

          const balanceData = {
            capitalPaid: increment(putMoneyToRoute.capitalPaid),
            interestPaid: increment(putMoneyToRoute.interestPaid),
            arrearsPaid: increment(putMoneyToRoute.arrearsPaid),
            defermentPaid: increment(putMoneyToRoute.defermentPaid),
            totalPaid: increment(putMoneyToRoute.totalPaid)
          };

          // ============================================
          // BALANCE DEL COBRADOR
          // ============================================
          if (putMoneyToRoute.CollectorId) {
            const cashBalanceRef = doc(
              firestore,
              "companies",
              putMoneyToRoute.companyId,
              "routes",
              putMoneyToRoute.routeId,
              "cashBalances",
              putMoneyToRoute.CollectorId
            );

            batch.set(cashBalanceRef, balanceData, { merge: true });
          }
          // ============================================
          // BALANCE BANCARIO
          // ============================================
          else if (putMoneyToRoute.BankAccountId) {
            const bankBalanceRef = doc(
              firestore,
              "companies",
              putMoneyToRoute.companyId,
              "routes",
              putMoneyToRoute.routeId,
              "bankBalances",
              putMoneyToRoute.BankAccountId
            );

            batch.set(bankBalanceRef, balanceData, { merge: true });
          }

          // ============================================
          // BALANCE GENERAL DE LA RUTA
          // ============================================
          batch.set(routeRef, balanceData, { merge: true });
        }

        // Commit del chunk actual
        await batch.commit();
      }

      return ok({ state: true });
    } catch (error) {
      console.error("[PutMoneyToRoutes]", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }
}

// ==========================================
// 1. ROUTE MAPPERS
// ==========================================

export function documentToRoute(
  id: string,
  data: DocumentData,
  cashBalances: number,
  depositBalances: number
): Route {
  return {
    // --- IDENTIFICACIÓN ---
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    companyId: data.companyId ?? "",

    // --- BLOQUEO DE RUTA ---
    startDisabled: data.startDisabled ?? undefined,
    endDisabled: data.endDisabled ?? undefined,

    // --- COBRADOR ASIGNADO ---
    collectorId: data.collectorId ?? undefined,
    collectorName: data.collectorName ?? undefined,

    // --- VALORES FINANCIEROS ---
    capital: Number(data.capital ?? 0),
    interest: Number(data.interest ?? 0),
    amount: Number(data.amount ?? 0),

    arrears: Number(data.arrears ?? 0),
    arrearsDays: Number(data.arrearsDays ?? 0),

    deferment: Number(data.deferment ?? 0),
    defermentDays: Number(data.defermentDays ?? 0),

    total: Number(data.total ?? 0),
    cashBalances: cashBalances,
    depositBalances: depositBalances
  };
}

export function routeToDocument(
  route: Omit<Route, "id"> | Route
): DocumentData {
  const docData: DocumentData = {
    // --- IDENTIFICACIÓN ---
    name: route.name,
    description: route.description,
    companyId: route.companyId,

    // --- VALORES FINANCIEROS ---
    capital: route.capital,
    interest: route.interest,
    amount: route.amount,

    arrears: route.arrears,
    arrearsDays: route.arrearsDays,

    deferment: route.deferment,
    defermentDays: route.defermentDays,

    total: route.total,
  };

  // --- BLOQUEO DE RUTA ---
  if (route.startDisabled !== undefined) {
    docData.startDisabled = route.startDisabled;
  }

  if (route.endDisabled !== undefined) {
    docData.endDisabled = route.endDisabled;
  }

  // --- COBRADOR ASIGNADO ---
  if (route.collectorId !== undefined) {
    docData.collectorId = route.collectorId;
  }

  if (route.collectorName !== undefined) {
    docData.collectorName = route.collectorName;
  }

  return docData;
}
