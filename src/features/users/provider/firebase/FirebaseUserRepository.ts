import { collection, doc, getDoc, getDocs, query, setDoc, where, type DocumentData } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { User } from "../../domain/business/entities/User";
import type { getUserError, setUserError } from "../../domain/business/entities/userErrors";
import type { UserGateway } from "../../domain/infraestructure/UserGateway";
import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";
import type { GetUserByCompanyInput, GetUserByCompanyOutput } from "../../domain/business/useCases/GetUsersByCompanyCase";
import type { GetUsersByRouteInput, GetUsersByRouteOutput } from "../../domain/business/useCases/GetUsersByRouteUseCase";

export interface Globaluser {
  id: string
  companyId: string
}

export function DocumentToUser(id: string, data: DocumentData, companyId: string = ""): User {
  let collectorRoutes: Record<string, string[]> | undefined;
  if (data.collectorRoutes && typeof data.collectorRoutes === "object") {
    if (data.collectorRoutes instanceof Map) {
      collectorRoutes = Object.fromEntries(data.collectorRoutes);
    } else {
      collectorRoutes = data.collectorRoutes;
    }
  }

  return {
    id: id,
    companyId: companyId || data.companyId || "",
    email: data.email ?? "",
    name: data.name ?? "",
    roles: data.roles ?? [],
    totalAmount: data.totalAmount ?? 0,
    capital: data.capital ?? 0,
    interest: data.interest ?? 0,
    arrears: data.arrears ?? 0,
    funding: data.funding ?? 0,
    totalDebt: data.totalDebt ?? 0,
    idRoutes: data.idRoutes || [],
    collectorRoutes: collectorRoutes
  };
}

export function UserToDocument(user: Partial<User>): DocumentData {
  const result: DocumentData = {};
  if (user.name !== undefined) result.name = user.name;
  if (user.email !== undefined) result.email = user.email;
  if (user.companyId !== undefined) result.companyId = user.companyId;
  if (user.roles !== undefined) result.roles = user.roles;
  if (user.idRoutes !== undefined) result.idRoutes = user.idRoutes;
  if (user.collectorRoutes !== undefined) result.collectorRoutes = user.collectorRoutes;
  if (user.totalAmount !== undefined) result.totalAmount = user.totalAmount;
  if (user.capital !== undefined) result.capital = user.capital;
  if (user.interest !== undefined) result.interest = user.interest;
  if (user.arrears !== undefined) result.arrears = user.arrears;
  if (user.funding !== undefined) result.funding = user.funding;
  if (user.totalDebt !== undefined) result.totalDebt = user.totalDebt;
  return result;
}

export class FirebaseUserRepository implements UserGateway {
  async getUsersByCompany(
    input: GetUserByCompanyInput
  ): Promise<GetUserByCompanyOutput> {
    try {
      // ✅ Colección correcta (companyId)
      const refUsersCompany = collection(
        firestore,
        "companies",
        input.id,
        "users"
      );

      console.log("users con rol:", input.rol);

      let usersQuery;

      // 👉 Si viene rol, filtramos
      if (input.rol) {
        usersQuery = query(
          refUsersCompany,
          where("roles", "array-contains", input.rol)
        );
      } else {
        // 👉 Si no viene rol, traemos todos
        usersQuery = query(refUsersCompany);
      }

      // ✅ getDocs (NO getDoc)
      const snapshotUsersCompany = await getDocs(usersQuery);

      const users: User[] = snapshotUsersCompany.docs.map((doc) => {
        return DocumentToUser(doc.id, doc.data(), input.id);
      });

      return {
        state: ok(users),
      };
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "permission-denied":
            return { state: fail({ code: "UNKNOWN_ERROR" }) };
          case "unavailable":
            return { state: fail({ code: "NETWORK_ERROR" }) };
        }
      }

      return {
        state: fail({ code: "UNKNOWN_ERROR" }),
      };
    }
  }

  async getById2(
    userId: string,
    companyId: string
  ): Promise<Result<User | null, getUserError>> {
    try {

      /* =========================
         Usuario dentro de compañía
      ========================= */
      const refUserCompany = doc(
        firestore,
        "companies",
        companyId,
        "users",
        userId
      );

      const snapshotUserCompany = await getDoc(refUserCompany);

      const dataUserCompany = snapshotUserCompany.exists()
        ? snapshotUserCompany.data()
        : {};

      const userCompany = DocumentToUser(userId, dataUserCompany, companyId);

      console.log("usuario encontrado", userCompany);
      return ok(userCompany);

    } catch (error) {
      console.error(error);

      if (error instanceof FirebaseError) {
        console.log("error al obtener usuario:", error.code);
        switch (error.code) {
          case "permission-denied":
          case "unavailable":
            return fail({ code: "NETWORK_ERROR" });
        }
      }

      return fail({ code: "UNKNOWN_ERROR" });
    }
  }

  async getById(
    userId: string
  ): Promise<Result<User | null, getUserError>> {
    try {
      /* =========================
         Usuario global
      ========================= */

      const refGlobalUser = doc(firestore, "users", userId);
      const snapshotGlobalUser = await getDoc(refGlobalUser);

      if (!snapshotGlobalUser.exists()) {
        console.log("usuario no encontrado");
        return ok(null);
      }

      const dataGlobalUser = snapshotGlobalUser.data();

      const globalUser: Globaluser = {
        id: snapshotGlobalUser.id,
        companyId: dataGlobalUser.companyId,
      };

      /* =========================
         Usuario dentro de compañía
      ========================= */
      const refUserCompany = doc(
        firestore,
        "companies",
        globalUser.companyId,
        "users",
        globalUser.id
      );

      const snapshotUserCompany = await getDoc(refUserCompany);

      if (!snapshotUserCompany.exists()) {
        console.log("usuario no encontrado en compañía");
        return fail({ code: "USER_NOT_FOUND:IN_COMPANY" })
      }

      const dataUserCompany = snapshotUserCompany.data()

      const userCompany = DocumentToUser(globalUser.id, { ...dataGlobalUser, ...dataUserCompany }, globalUser.companyId);

      console.log("usuario encontrado", userCompany);
      return ok(userCompany);

    } catch (error) {
      console.error(error);

      if (error instanceof FirebaseError) {
        console.log("error al obtener usuario:", error.code);
        switch (error.code) {
          case "permission-denied":
          case "unavailable":
            return fail({ code: "NETWORK_ERROR" });
        }
      }

      return fail({ code: "UNKNOWN_ERROR" });
    }
  }


  async setUser(user: User): Promise<Result<void, setUserError>> {
    try {
      // 1. Actualizar usuario global (roles, email, companyId)
      const refGlobal = doc(firestore, "users", user.id);
      await setDoc(refGlobal, {
        email: user.email,
        companyId: user.companyId,
        roles: user.roles,
      }, { merge: true });

      return ok(undefined);
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

  async updateCollectorRoutes(
    userId: string,
    companyId: string,
    routes: Record<string, string[]>
  ): Promise<Result<void, setUserError>> {
    try {
      const refUserCompany = doc(
        firestore,
        "companies",
        companyId,
        "users",
        userId
      );

      // routes ya es un objeto plano, Firestore-friendly
      await setDoc(
        refUserCompany,
        {
          collectorRoutes: routes,
        },
        { merge: true }
      );

      return ok(undefined);
    } catch (error) {
      console.error("Error updating collector routes", error);

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

  async updateTotalAmount(
    userId: string,
    companyId: string,
    newAmount: number
  ): Promise<Result<void, setUserError>> {
    try {
      const refUserCompany = doc(
        firestore,
        "companies",
        companyId,
        "users",
        userId
      );

      await setDoc(
        refUserCompany,
        {
          totalAmount: newAmount,
        },
        { merge: true }
      );

      return ok(undefined);
    } catch (error) {
      console.error("Error updating user total amount", error);

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

  async updateUserRoutes(
    userId: string,
    companyId: string,
    idRoutes: string[]
  ): Promise<Result<void, setUserError>> {
    try {
      const refUserCompany = doc(
        firestore,
        "companies",
        companyId,
        "users",
        userId
      );

      await setDoc(
        refUserCompany,
        {
          idRoutes: idRoutes,
        },
        { merge: true }
      );

      return ok(undefined);
    } catch (error) {
      console.error("Error updating user routes", error);

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

  async getUsersByRoute(
    input: GetUsersByRouteInput
  ): Promise<GetUsersByRouteOutput> {
    try {
      const refUsersCompany = collection(
        firestore,
        "companies",
        input.companyId,
        "users"
      );

      const usersQuery = query(
        refUsersCompany,
        where("idRoutes", "array-contains", input.routeId)
      );

      const snapshot = await getDocs(usersQuery);

      const users: User[] = snapshot.docs.map((doc) => {
        return DocumentToUser(doc.id, doc.data(), input.companyId);
      });

      return {
        state: ok(users),
      };
    } catch (error) {
      console.error("Error getting users by route", error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case "permission-denied":
            return { state: fail({ code: "UNKNOWN_ERROR" }) };
          case "unavailable":
            return { state: fail({ code: "NETWORK_ERROR" }) };
        }
      }
      return { state: fail({ code: "UNKNOWN_ERROR" }) };
    }
  }

  async updateUser(companyId: string, user: User): Promise<Result<void, setUserError>> {
    try {
      const refUserCompany = doc(
        firestore,
        "companies",
        companyId,
        "users",
        user.id
      );

      const { roles, id, companyId: _, ...userWithoutRoles } = user;

      await setDoc(
        refUserCompany,
        UserToDocument(userWithoutRoles),
        { merge: true }
      );

      return ok(undefined);
    } catch (error) {
      console.error("Error updating user", error);
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
}
