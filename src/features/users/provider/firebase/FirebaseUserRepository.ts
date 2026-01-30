import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { User } from "../../domain/business/entities/User";
import type { getUserError, setUserError } from "../../domain/business/entities/userErrors";
import type { UserGateway } from "../../domain/infraestructure/UserGateway";
import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";
import type { GetUserByCompanyInput, GetUserByCompanyOutput } from "../../domain/business/useCases/GetUsersByCompanyCase";

export interface Globaluser {
  id:string
  companyId:string
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

      return {
        id: doc.id,
        ...data,
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

  async getById(userId: string): Promise<Result<User | null, getUserError>> {
    try {
      const refGlobalUser = doc(firestore, "users", userId)
      const snapshotGlobalUser = await getDoc(refGlobalUser)

      //s el usuario no fue encontrado
      if (!snapshotGlobalUser.exists()) {
        console.log("usuario no encontrado")
        return ok(null)
      }

      const dataGlobalUser = snapshotGlobalUser.data()

      const globalUser: Globaluser = {
        id: snapshotGlobalUser.id,
        companyId: dataGlobalUser.companyId
      }
        const refUserCompany = doc(firestore, "companies", globalUser.companyId,"users",globalUser.id)
      const snapshotUserCompany = await getDoc(refUserCompany)

      const dataUserCompany = snapshotGlobalUser.data()

       const UserCompany: User = {
        id: snapshotUserCompany.id,
        companyId: dataUserCompany.companyId,
        email:dataUserCompany.email,
        name:dataUserCompany.name,
        roles:dataGlobalUser.roles,
      }
        console.log("usuario encontrado")
      console.log("companyId:" + UserCompany.companyId)
      return ok(UserCompany)
    } catch (error) {
      if (error instanceof FirebaseError) {
          console.log("errro al obtener usuario"+error.code)
        switch (error.code) {
          case "permission-denied":
          case "unavailable":
            return fail({ code: "NETWORK_ERROR" })
        }
      }

      return fail({ code: "UNKNOWN_ERROR" })
    }
  }


  async setUser(user: User): Promise<Result<void, setUserError>> {
    try {
      const ref = doc(firestore, "users", user.id);
      // setDoc con { merge: false } para sobreescribir campos existentes
      await setDoc(ref, {
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
}
