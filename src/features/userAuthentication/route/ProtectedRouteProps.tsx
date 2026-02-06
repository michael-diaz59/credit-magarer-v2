import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import type { Role } from "../../users/domain/business/entities/User";
import { ScreenPaths } from "../../../core/helpers/name_routes";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedAuth({ children }: ProtectedRouteProps) {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) {
    console.log("redirigido a login")
    return <Navigate to={ScreenPaths.log.logIn} replace />;
  }


  return children;
}


 export function ProtectedOfficeAdvisor({ children }: ProtectedRouteProps) {
  const user = useAppSelector((state) => state.user.user);
  

  if(!user){
      return <Navigate to="/" replace />;
  }

  const roles=user.roles
  console.log(roles)
  if (roles.includes("OFFICE_ADVISOR") || roles.includes("ADMIN")) {
    return children;
  }

  return <Navigate to="/" replace />;
}


export function ProtectedFieldAdvisor({ children }: ProtectedRouteProps) {
  const roles: Role[] | undefined = useAppSelector((state) => state.user.user?.roles);

    if (!roles) {
      console.log("no tiene roles el usuario")
    return <Navigate to="/" replace />;
  }

  // No tiene el rol requerido
  if (roles.includes("FIELD_ADVISOR") || roles.includes("ADMIN")) {
      return children;
  }
  console.log("no tiene el rol requerido")
  
    return <Navigate to="/" replace />;


}

export function ProtectedAccountant({ children }: ProtectedRouteProps) {
    const roles: Role[] | undefined = useAppSelector((state) => state.user.user?.roles);

    if (!roles) {
    return <Navigate to="/" replace />;
  }

  // No tiene el rol requerido
  if (roles.includes("ACCOUNTANT") || roles.includes("ADMIN")) {
   return children;
  }
   return <Navigate to="/" replace />;
  
}

export function ProtectedAuditor({ children }: ProtectedRouteProps) {
    const roles: Role[] | undefined = useAppSelector((state) => state.user.user?.roles);


    if (!roles) {
    return <Navigate to="/" replace />;
  }

  // No tiene el rol requerido
  if (roles.includes("AUDITOR") || roles.includes("ADMIN")) {
   return children;
  }
   return <Navigate to="/" replace />;
}

export function ProtectedCollector({ children }: ProtectedRouteProps) {
    const roles: Role[] | undefined = useAppSelector((state) => state.user.user?.roles);

    if (!roles) {
    return <Navigate to="/" replace />;
  }

  // No tiene el rol requerido
  if (roles.includes("COLLECTOR") || roles.includes("ADMIN")) {
     return children;
  }
   return <Navigate to="/" replace />;


}
