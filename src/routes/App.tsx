import { Routes, Route } from "react-router-dom";
import BaseLayout from "./base/base_layout.tsx";
import { useAppSelector } from "../store/redux/coreRedux.ts";
import {
  ProtectedAuth,
  ProtectedOfficeAdvisor,
} from "../features/userAuthentication/route/ProtectedRouteProps.tsx";
import LoginPage from "./login/LoginController.tsx";
import Dashboard from "../atomic_design/templates/home/home.tsx";
import OfficeSalesLayout from "./seller/OfficeSeller_layout.tsx";
import { ClientListPage } from "../atomic_design/templates/sale/clients.tsx";
import { CostumerForm } from "../atomic_design/templates/costumers/CostumerForm.tsx";
import { ScreenPaths } from "../core/helpers/name_routes.ts";
import { SelectAdvisorRolePage } from "../atomic_design/templates/advisor/SelectAdvisorRolePage.tsx";
import BaseSalesLayout from "./seller/BaseSeller_layout.tsx";
import { OfficeVisit } from "../atomic_design/templates/advisor/office/OfficeVisit.tsx";
import { VisitListPage } from "../atomic_design/templates/advisor/field/VisitListPage.tsx";
import { FieldVisit } from "../atomic_design/templates/advisor/field/DetailVisit.tsx";
import { CreateDebtScreen } from "../atomic_design/templates/advisor/office/createDebt.tsx";
import { DebtsListScreen } from "../atomic_design/templates/advisor/office/listDebts.tsx";

function NotFound() {
  return <h1>404</h1>;
}

function FullScreenLoader() {
  return <h1>cargando credenciales de usuario</h1>;
}

export default function App() {
  const isInitialized = useAppSelector((state) => state.auth.initialized);
  const userIsInit= useAppSelector((state) => state.user.initialState);

  // ⏳ mostramos pantalla de carga mientras se inicializa firebase auth
  if (!isInitialized || !userIsInit) {
    console.log("App no rendered", isInitialized);
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      {/* 🔓 Ruta pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* 🔐 Rutas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedAuth>
            <BaseLayout />
          </ProtectedAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path={ScreenPaths.advisor.home}
        element={
          <ProtectedAuth>
            <OfficeSalesLayout />
          </ProtectedAuth>
        }
      >
        <Route index element={<SelectAdvisorRolePage />} />
      </Route>

      <Route
        path={ScreenPaths.advisor.office.home}
        element={
          <ProtectedAuth>
            <ProtectedOfficeAdvisor>
              <OfficeSalesLayout />
            </ProtectedOfficeAdvisor>
          </ProtectedAuth>
        }
      >
        {/* index envia a la misma ruta que ClientListPage */}
        <Route index element={<ClientListPage />} />
        {/* costumers */}
        <Route
          path={ScreenPaths.advisor.office.costumer.costumers}
          element={<ClientListPage />}
        />
        <Route
          path={ScreenPaths.advisor.office.costumer.createCostumer}
          element={<CostumerForm />}
        />
        <Route
          path={ScreenPaths.advisor.office.costumer.costumer(":costumerId")}
          element={<CostumerForm />}
        />
        {/* visit */}

        <Route
          path={ScreenPaths.advisor.office.visit.visits}
          element={<VisitListPage />}
        />
        <Route
          path={ScreenPaths.advisor.office.visit.visit(":visitId")}
          element={<OfficeVisit />}
        />
        <Route
          path={ScreenPaths.advisor.office.visit.Costumer(
            ":idCostumer",
            ":visitId",
          )}
          element={<OfficeVisit />}
        />
        <Route
          path={ScreenPaths.advisor.office.visit.CreateVisit}
          element={<OfficeVisit />}
        />

        {/* debit */}

        <Route
          path={ScreenPaths.advisor.office.debit.debits}
          element={<DebtsListScreen />}
        />
        <Route
          path={ScreenPaths.advisor.office.debit.debit(":debitId")}
          element={<CreateDebtScreen />}
        />
        <Route
          path={ScreenPaths.advisor.office.debit.CreateDebits}
          element={<CreateDebtScreen />}
        />
      </Route>

      <Route
        path={ScreenPaths.advisor.field.home}
        element={
          <ProtectedAuth>
            <ProtectedOfficeAdvisor>
              <BaseSalesLayout />
            </ProtectedOfficeAdvisor>
          </ProtectedAuth>
        }
      >
        {/* index envia a la misma ruta que ClientListPage */}
        <Route index element={<VisitListPage />} />
        <Route
          path={ScreenPaths.advisor.field.visit.visits}
          element={<VisitListPage />}
        />
        <Route
          path={ScreenPaths.advisor.field.visit.visit(":visitId")}
          element={<FieldVisit />}
        />
        <Route
          path={ScreenPaths.advisor.field.visit.Costumer(
            ":costumerId",
            ":visitId",
          )}
          element={<CostumerForm />}
        />
      </Route>
    </Routes>
  );
}
