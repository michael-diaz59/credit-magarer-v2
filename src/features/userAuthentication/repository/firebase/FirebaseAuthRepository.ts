import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "firebase/auth"

import { firebaseAuth } from "../../../../store/firebase/firebase"

import { fail, ok, type Result } from "../../../../core/helpers/ResultC"
import { FirebaseError } from "firebase/app"
import type { UserAuthentication } from "../../domain/business/entities/UserAuthentication"
import type { AuthGateway } from "../../domain/infraestructure/AuthenticationGateway"
import type { GetLogInErros, LoginError, LogoutError } from "../../domain/business/entities/AuthErrors"


export class FirebaseAuthRepository implements AuthGateway {

    // ------------------------
    // LOGIN
    // ------------------------
    async login(
        email: string,
        password: string
    ): Promise<Result<UserAuthentication, LoginError>> {
        try {
            const credential = await signInWithEmailAndPassword(
                firebaseAuth,
                email,
                password
            )

           

            const user = credential.user

             console.log(user)

            return ok({
                id: user.uid,
                email: user.email!,
            })
        } catch (error) {
            console.log("error al iniciar sesion")
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "auth/invalid-credential":
                    case "auth/wrong-password":
                    case "auth/user-not-found":
                        return fail({ code: "INVALID_CREDENTIALS" })

                    case "auth/network-request-failed":
                        return fail({ code: "NETWORK_ERROR" })
                }
            }

            return fail({ code: "UNKNOWN_ERROR" })
        }
    }

    // ------------------------
    // LOGOUT
    // ------------------------
    async logout(): Promise<Result<void, LogoutError>> {
        try {
            await signOut(firebaseAuth)
            return ok(undefined)
        } catch {
            return fail({ code: "UNKNOWN_ERROR" })
        }
    }

    // ------------------------
    // GET CURRENT USER (ONE SHOT)
    // ------------------------
    async getLogIn(): Promise<
        Result<UserAuthentication | null, GetLogInErros>
    > {
        try {
            const user = firebaseAuth.currentUser

            if (!user) {
                return ok(null)
            }

            return ok({
                id: user.uid,
                email: user.email!,
            })
        } catch {
            return fail({ code: "UNKNOWN_ERROR" })
        }
    }

    // ------------------------
    // AUTH STATE SYNC (OBSERVER)
    // ------------------------
    onAuthStateChanged(
        callback: (
            result: Result<UserAuthentication | null, GetLogInErros>
        ) => void
    ): () => void {
        return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
            if (!firebaseUser) {
                callback(ok(null))
                return
            }

            callback(
                ok({
                    id: firebaseUser.uid,
                    email: firebaseUser.email!,
                })
            )
        })
    }
}