import { useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "../../../../store/firebase/firebase";

import { useAppDispatch } from "../../../../store/redux/coreRedux";
import type { UserAuthentication } from "../../domain/business/entities/UserAuthentication";
import {
   clearAuthUser,
    setAuthUser } from "../../slices/authSliceFirebase";
import UserOrchestrator from "../../../users/domain/infraestructure/UserOrchestrator";

//componente encargado de proveer el contexto de autenticacion a la aplicacion y dejar el oyente activo para cambios de estado de autenticacion
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const userOrchestrator = useMemo(
    () => new UserOrchestrator (dispatch),
    [dispatch]
  )

  useEffect(() => {

    onAuthStateChanged(firebaseAuth, async (firebaseUser) => {

      console.log("firebaseUser+"+firebaseUser)
   
      if (firebaseUser) {

        const user: UserAuthentication = {
          id: firebaseUser.uid===null? "":firebaseUser.uid,
        };
         userOrchestrator.getUser({
          id: firebaseUser.uid,
        })
        dispatch(setAuthUser(user));
      } else {
        dispatch(clearAuthUser());
      }
    });
        

  }, [dispatch,userOrchestrator]);

  return <>{children}</>;
}
