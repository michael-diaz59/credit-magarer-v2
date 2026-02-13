import { Routes, Route } from "react-router-dom";
import BaseLayout from "./base/base_layout.tsx";
import { useAppSelector } from "../store/redux/coreRedux.ts";
import {
  ProtectedAuditor,
  ProtectedAuth,
  ProtectedCollector,
  ProtectedFieldAdvisor,
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
import { DebtsListScreen } from "../atomic_design/templates/advisor/office/listDebts.tsx";
import { CreateDebtScreen } from "../atomic_design/templates/debt/CreateDebtScreen.tsx";
import { ViewDebtScreen } from "../atomic_design/templates/debt/debts/ViewDebtScreen.tsx";
import { CustomerVisitEntryPage } from "../atomic_design/templates/advisor/visit/CustomerVisitEntryPage.tsx";
import { AuditEntryPoint } from "../atomic_design/templates/audit/AuditEntryPoint.tsx";
import { DebtsForCustomer } from "../atomic_design/templates/debt/audit/DebtsForCustomer.tsx";
import Auditor_layout from "./auditor/Auditor_layout.tsx";
import { CustomersAudit } from "../atomic_design/templates/audit/CustomersAudit.tsx";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CustomerEntryPage } from "../atomic_design/templates/costumers/CustomerEntryPage.tsx";
import { SelectListDebts } from "../atomic_design/templates/audit/SelectListDebts.tsx";
import { AuditorDebtsFiltersScreen } from "../atomic_design/templates/audit/AuditorDebtsFiltersScreen.tsx";
import { AuditDebtScreen } from "../atomic_design/templates/debt/debts/AuditDebtScreen.tsx";
import Collector_layout from "./collector/Collector_layout.tsx";
import { RecolectorHome } from "../atomic_design/templates/recollector/RecolectorHome.tsx";
import { InstallmentDetailScreen } from "../atomic_design/templates/recollector/InstallmentDetailScreen.tsx";
import { ProfileScreen } from "../atomic_design/templates/configuration/ProfileScreen.tsx";
import { PaymentsListScreen } from "../atomic_design/templates/audit/AuditPaymentsListScreen.tsx";
import { PaymentDetailScreen } from "../atomic_design/templates/audit/PaymentDetailScreen.tsx";
import { AuditorInstallmentsScreen } from "../atomic_design/templates/audit/AuditorInstallmentsScreen.tsx";
import { CreateVisit } from "../atomic_design/templates/advisor/office/CreateVisit.tsx";

function NotFound() {
  return <h1>404</h1>;
}

function FullScreenLoader() {
  return <h1>cargando credenciales de usuario</h1>;
}

export default function App() {
  const isInitialized = useAppSelector((state) => state.auth.initialized);
  const userIsInit = useAppSelector((state) => state.user.initialState);

  // ⏳ mostramos pantalla de carga mientras se inicializa firebase auth
  if (!isInitialized || !userIsInit) {
    console.log("App no rendered", isInitialized);
    return <FullScreenLoader />;
  }

  return (
    <Routes>
      {/* 🔓 Ruta pública */}
      <Route path={ScreenPaths.log.logIn} element={<LoginPage />} />

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
            <BaseLayout />
          </ProtectedAuth>
        }
      >
        <Route index element={<SelectAdvisorRolePage />} />
      </Route>

           {/* rutas de configuracion */}
      <Route
        path={ScreenPaths.Configuration.home}
        element={
          <ProtectedAuth>
            <BaseLayout />
          </ProtectedAuth>
        }
      >
         {/* home  de configuracion */}
        <Route index element={<ProfileScreen />} />

      </Route>
        {/* rutas de cobrador */}
      <Route
        path={ScreenPaths.collector.home}
        element={
          <ProtectedAuth>
            <ProtectedCollector>
              <Collector_layout />
            </ProtectedCollector>
          </ProtectedAuth>
        }
      >
         {/* home  de cobrador */}
        <Route index element={<RecolectorHome />} />

         {/* installment de un cobrador*/}
        <Route
          path={ScreenPaths.collector.installment(":id")}
          element={<InstallmentDetailScreen />}
        />

      </Route>

      {/* rutas de auditor */}
      <Route
        path={ScreenPaths.auditor.home}
        element={
          <ProtectedAuth>
            <ProtectedAuditor>
              <Auditor_layout />
            </ProtectedAuditor>
          </ProtectedAuth>
        }
      >
        {/* rutas de auditor home*/}
        <Route index element={<SelectListDebts />} />

        {/* rutas de auditor lista de clientes para ver sus deudas*/}
        <Route
          path={ScreenPaths.auditor.debitsC}
          element={<AuditEntryPoint />}
        />

         {/* rutas de auditor lista de deudas por estado*/}
        <Route
          path={ScreenPaths.auditor.debitsS}
          element={<AuditorDebtsFiltersScreen />}
        />

         {/* rutas de auditor, lista de debitos de un cliente*/}
        <Route
          path={ScreenPaths.auditor.debitsCustomer(":docCostumer")}
          element={<DebtsForCustomer />}
        />

        {/* rutas de auditor ver/editar un debt*/}
        <Route
          path={ScreenPaths.auditor.debit(":debitId")}
          element={<AuditDebtScreen />}
        />

          {/* rutas de auditor,ver los  clientes*/}
        <Route
          path={ScreenPaths.auditor.costumers}
          element={<CustomersAudit />}
        />

         {/* rutas de auditor, clientes*/}
        <Route
          path={ScreenPaths.auditor.customer(":idCustomer")}
          element={<CostumerForm />}
        />

        {/* rutas de auditor, ver cuotas*/}
        <Route
          path={ScreenPaths.auditor.installments(":idDebt")}
          element={<AuditorInstallmentsScreen />}
        />

         {/* rutas de auditor, ver pagos*/}
        <Route
          path={ScreenPaths.auditor.payments(":idInstallment")}
          element={<PaymentsListScreen />}
        />

           {/* rutas de auditor, ver la informacion de un pago*/}
        <Route
          path={ScreenPaths.auditor.payment(":paymentId")}
          element={<PaymentDetailScreen />}
        />
      </Route>

{/* rutas de asesor de oficina*/}
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
          element={<CustomerVisitEntryPage />}
        />
        {/* visit */}
        <Route
          path={ScreenPaths.advisor.office.visit.visits2(":documentCostumer")}
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
          element={<CreateVisit />}
        />

        <Route
          path={ScreenPaths.advisor.office.visit.CreateVisit2(":documentCostumer")}
          element={<CreateVisit />}
        />

        {/* debit */}

        <Route
          path={ScreenPaths.advisor.office.debit.debits}
          element={<DebtsListScreen />}
        />
        <Route
          path={ScreenPaths.advisor.office.debit.debit(":debitId")}
          element={<ViewDebtScreen />}
        />
        <Route
          path={ScreenPaths.advisor.office.debit.CreateDebits}
          element={<CreateDebtScreen />}
        />
      </Route>

  {/* rutas asesor de campo*/}
      <Route
        path={ScreenPaths.advisor.field.home}
        element={
          <ProtectedAuth>
            <ProtectedFieldAdvisor>
              <BaseSalesLayout />
            </ProtectedFieldAdvisor>
          </ProtectedAuth>
        }
      >
        {/* index envia a la misma ruta que ClientListPage */}
        <Route index element={<VisitListPage />} />
        <Route
          path={ScreenPaths.advisor.field.visit.visits}
          element={<CustomerVisitEntryPage />}
        />

        <Route
          path={ScreenPaths.advisor.field.visit.visits2(":documentCostumer")}
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
