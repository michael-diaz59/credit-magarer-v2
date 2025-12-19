// auth/auth.service.ts
import {
  signInWithEmailAndPassword,
  signOut,
  type UserCredential
} from "firebase/auth";
import { auth } from "../../../store/firebase/firebase";

export async function loginWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  return signOut(auth);
}
