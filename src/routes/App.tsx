import { Routes, Route } from "react-router-dom";


import BaseLayout from "./base/base_layout.tsx";
import { useAppSelector } from "../store/redux/coreRedux.ts";
import { ProtectedRoute } from "../features/userAuthentication/route/ProtectedRouteProps.tsx";
import LoginPage from "./login/LoginPage.tsx";
import Dashboard from "../atomic_design/templates/home/home.tsx";
import SalesLayout from "./seller/seller_layout.tsx";
import { ClientListPage } from "../atomic_design/templates/sale/clients.tsx";

function NotFound() {
  return <h1>404</h1>;
}

function FullScreenLoader() {
  return <h1>cargando</h1>;
}

export default function App() {
  const { initialized } = useAppSelector((state) => state.auth);

  // ⏳ Esperamos a Firebase
  if (!initialized) {
     console.log("App no rendered", initialized);
    return <FullScreenLoader />;
  }
  console.log("App rendered, initialized:", initialized);

  return (
    <Routes>
      {/* 🔓 Ruta pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* 🔐 Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <BaseLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            < SalesLayout/>
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientListPage />} />
      </Route>
    </Routes>
  );
}
