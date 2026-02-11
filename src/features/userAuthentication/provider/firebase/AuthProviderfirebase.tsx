import { useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "../../../../store/firebase/firebase";

import { useAppDispatch } from "../../../../store/redux/coreRedux";
import type { UserAuthentication } from "../../domain/business/entities/UserAuthentication";
import {
   clearAuthUser,
    setAuthUser } from "../../slices/authSliceFirebase";
import UserOrchestrator from "../../../users/domain/infraestructure/UserOrchestrator";
import { clearUser } from "../../../users/slices/ReduxUserSlice";



//componente encargado de proveer el contexto de autenticacion a la aplicacion y dejar el oyente activo para cambios de estado de autenticacion
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const userOrchestrator = useMemo(
    () => new UserOrchestrator (dispatch),
    [dispatch]
  )

useEffect(() => {
  const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
    console.log("firebaseUser:", firebaseUser);
    if (firebaseUser) {
      const user: UserAuthentication = {
        id: firebaseUser.uid,
      };
      await userOrchestrator.getUser({ id: firebaseUser.uid });
      dispatch(setAuthUser(user));
    } else {
      console.log("usuario no encontrado en bd")
      dispatch(clearAuthUser());
      dispatch(clearUser())
    }
  });

  return () => unsubscribe();
}, [dispatch, userOrchestrator]);

  return <>{children}</>;
}
