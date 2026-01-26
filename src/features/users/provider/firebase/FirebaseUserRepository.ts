import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import type { User } from "../../domain/business/entities/User";
import type { getUserError, setUserError } from "../../domain/business/entities/userErrors";
import type { UserGateway } from "../../domain/infraestructure/UserGateway";
import { firestore } from "../../../../store/firebase/firebase";
import { FirebaseError } from "firebase/app";
import type { GetUserByCompanyInput, GetUserByCompanyOutput } from "../../domain/business/useCases/GetUsersByCompanyCase";

export class FirebaseUserRepository implements UserGateway {
  async getUsersByCompany(input: GetUserByCompanyInput): Promise<GetUserByCompanyOutput> {
    try {
      const ref = collection(
        firestore,
        "users"
      );

      let q;

       console.log("users con rol "+input.rol)

      // 👉 Si viene rol, filtramos por array-contains
      if (input.rol) {
         console.log("users con rol queri")
        q = query(ref, where("roles", "array-contains", input.rol));
      } else {
        // 👉 Si no viene rol, traemos todos
        q = query(ref);
      }

      const snapshot = await getDocs(q);

      const users: User[] = snapshot.docs.map((doc) => {
        const data = doc.data();
         console.log("users")
        console.log(data)

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
            return {
              state: fail({ code: "UNKNOWN_ERROR" }),
            };
          case "unavailable":
            return {
              state: fail({ code: "NETWORK_ERROR" }),
            };
        }
      }

      return {
        state: fail({ code: "UNKNOWN_ERROR" }),
      };
    }
  }

  async getById(userId: string): Promise<Result<User | null, getUserError>> {
    try {
      const ref = doc(firestore, "users", userId)
      const snapshot = await getDoc(ref)

      //s el usuario no fue encontrado
      if (!snapshot.exists()) {
        console.log("usuario no encontrado")
        return ok(null)
      }

      const data = snapshot.data()

      const user: User = {
        id: snapshot.id,
        name:data.name,
        email: data.email,
        companyId: data.companyId,
        roles: data.roles,
      }
        console.log("usuario encontrado")
      console.log("companyId:" + data.companyId)
      return ok(user)
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
