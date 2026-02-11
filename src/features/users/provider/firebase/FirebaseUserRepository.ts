import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { User } from "../../domain/business/entities/User";
import type { getUserError, setUserError } from "../../domain/business/entities/userErrors";
import type { UserGateway } from "../../domain/infraestructure/UserGateway";
import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";
import type { GetUserByCompanyInput, GetUserByCompanyOutput } from "../../domain/business/useCases/GetUsersByCompanyCase";

export interface Globaluser {
  id: string
  companyId: string
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
        const data = doc.data();

        // Convertir objeto plano a Map para collectorRoutes si existe
        let collectorRoutes: Map<string, string[]> | undefined;
        if (data.collectorRoutes) {
          try {
            collectorRoutes = new Map(Object.entries(data.collectorRoutes));
          } catch (e) {
            console.error("Error parsing collectorRoutes", e);
          }
        }

        return {
          id: doc.id,
          ...data,
          collectorRoutes
        } as User;
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

    // Si no existe el doc en compañía, usamos fallback al global
    const dataUserCompany = snapshotUserCompany.exists()
      ? snapshotUserCompany.data()
      : dataGlobalUser;

    /* =========================
       collectorRoutes como Record
    ========================= */
    const collectorRoutes: Record<string, string[]> | undefined =
      dataUserCompany.collectorRoutes &&
      typeof dataUserCompany.collectorRoutes === "object"
        ? dataUserCompany.collectorRoutes
        : undefined;

    /* =========================
       Construcción final del usuario
    ========================= */
    const userCompany: User = {
      id: globalUser.id,
      companyId: globalUser.companyId,
      email: dataUserCompany.email ?? dataGlobalUser.email,
      name: dataUserCompany.name ?? dataGlobalUser.name,
      roles: dataGlobalUser.roles,
      collectorRoutes,
    };

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
}
