import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type Auth,
} from "firebase/auth"
import type { AuthRepository } from "../../domain/AuthRepository"
import { fail, ok, type Result } from "../../../../core/helpers/ResultC"
import { FirebaseError } from "firebase/app"
import type { UserAuthentication } from "../../domain/UserAuthentication"
import type { GetCurrentUserError, LoginError, LogoutError } from "../../domain/AuthErrors"


export class FirebaseAuthRepository implements AuthRepository {
    private auth: Auth

    constructor(auth: Auth) {
        this.auth = auth
    }

    // ------------------------
    // LOGIN
    // ------------------------
    async login(
        email: string,
        password: string
    ): Promise<Result<UserAuthentication, LoginError>> {
        try {
            const credential = await signInWithEmailAndPassword(
                this.auth,
                email,
                password
            )

            const user = credential.user

            return ok({
                id: user.uid,
                email: user.email!,
            })
        } catch (error) {
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
            await signOut(this.auth)
            return ok(undefined)
        } catch {
            return fail({ code: "UNKNOWN_ERROR" })
        }
    }

    // ------------------------
    // GET CURRENT USER (ONE SHOT)
    // ------------------------
    async getCurrentUser(): Promise<
        Result<UserAuthentication | null, GetCurrentUserError>
    > {
        try {
            const user = this.auth.currentUser

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
            result: Result<UserAuthentication | null, GetCurrentUserError>
        ) => void
    ): () => void {
        return onAuthStateChanged(this.auth, (firebaseUser) => {
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