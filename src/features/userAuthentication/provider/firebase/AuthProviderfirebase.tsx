import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../../store/firebase/firebase";
import {
  clearUser,
  setUser,
  type UserState,
} from "../../../../store/redux/authsliceFirebase";
import { useAppDispatch } from "../../../../store/redux/coreRedux";



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user: UserState = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        };
        dispatch(setUser(user));
      } else {
        dispatch(clearUser());
      }
    });

    return unsubscribe;
  }, [dispatch]);

  return <>{children}</>;
}
