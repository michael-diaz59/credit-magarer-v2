import { Routes, Route } from "react-router-dom";
import BaseLayout from "./base/base_layout.tsx";
import { useAppSelector } from "../store/redux/coreRedux.ts";
import {
  ProtectedAuditor,
  ProtectedAuth,
  ProtectedCollector,
  ProtectedFieldAdvisor,
  ProtectedOfficeAdvisor,
  ProtectedAccountant,
  ProtectedAdmin,
} from "../features/userAuthentication/route/ProtectedRouteProps.tsx";
import { AdminDashboard } from "../atomic_design/templates/admin/AdminDashboard.tsx";
import LoginPage from "./login/LoginController.tsx";
import Dashboard from "../atomic_design/templates/home/home.tsx";
import { UploadExcelScreen } from "../atomic_design/templates/home/UploadExcelScreen.tsx";
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
import { SelectListDebts } from "../atomic_design/templates/audit/SelectListDebts.tsx";
import { AuditorDebtsFiltersScreen } from "../atomic_design/templates/audit/AuditorDebtsFiltersScreen.tsx";
import { AuditDebtScreen } from "../atomic_design/templates/debt/debts/AuditDebtScreen.tsx";
import Collector_layout from "./collector/Collector_layout.tsx";
import { RecolectorHome } from "../atomic_design/templates/recollector/RecolectorHome.tsx";
import { InstallmentDetailScreen } from "../atomic_design/templates/recollector/InstallmentDetail/InstallmentDetailScreen2.tsx";
import { ProfileScreen } from "../atomic_design/templates/configuration/ProfileScreen.tsx";
import { RouteAdministrationScreen } from "../atomic_design/templates/configuration/RouteAdministrationScreen.tsx";
import { CreateRouteScreen } from "../atomic_design/templates/configuration/CreateRouteScreen.tsx";
import { EditRouteScreen } from "../atomic_design/templates/configuration/EditRouteScreen.tsx";
import { PaymentsListScreen } from "../atomic_design/templates/audit/AuditPaymentsListScreen.tsx";
import { PaymentDetailScreen } from "../atomic_design/templates/audit/PaymentDetailScreen.tsx";
import { AuditorInstallmentsScreen } from "../atomic_design/templates/audit/AuditorInstallmentsScreen.tsx";
import { CollectorDebtInstallmentsScreen } from "../atomic_design/templates/recollector/CollectorDebtInstallmentsScreen.tsx";
import { CollectorDebtsScreen } from "../atomic_design/templates/recollector/CollectorDebtsScreen.tsx";
import { CreateVisit } from "../atomic_design/templates/advisor/office/CreateVisit.tsx";
import { DailyOperationsScreen } from "../atomic_design/templates/audit/DailyOperationsScreen.tsx";
import { CollectionAttemptDetailScreen } from "../atomic_design/templates/audit/CollectionAttemptDetailScreen.tsx";
import { BankAccountsAdministrationScreen } from "../atomic_design/templates/configuration/BankAccountsAdministrationScreen.tsx";
import { AccountantDashboard } from "../atomic_design/templates/accountant/AccountantDashboard.tsx";
import { AccountantDailyOperations } from "../atomic_design/templates/accountant/movementAccountant.tsx";
import { AccountantDebtsScreen } from "../atomic_design/templates/accountant/AccountantDebtsScreen.tsx";
import { AccountantDebtsForCustomer } from "../atomic_design/templates/accountant/debt/AccountantDebtsForCustomer.tsx";
import { PaymentInvoiceScreen } from "../atomic_design/templates/accountant/PaymentAccountant/PaymentInvoiceScreen.tsx";
import { RoutesBalanceScreen } from "../atomic_design/templates/accountant/RoutesBalance/RoutesBalanceScreen.tsx";
import { BalanceSheetScreen } from "../atomic_design/templates/accountant/BalanceSheet/BalanceSheetScreen.tsx";
import { AccountantPendingDeliveryScreen } from "../atomic_design/templates/accountant/AccountantPendingDeliveryScreen.tsx";
import { IncomeRegistrationScreen } from "../atomic_design/templates/accountant/incomes/IncomeRegistrationScreen.tsx";
import { FinancialDebtRegistrationScreen } from "../atomic_design/templates/accountant/FinancialDebt/FinancialDebtRegistrationScreen.tsx";
import { FinancialDebtsListScreen } from "../atomic_design/templates/accountant/FinancialDebt/FinancialDebtsListScreen.tsx";
import { CreateFinancialPaymentScreen } from "../atomic_design/templates/accountant/FinancialDebt/CreateFinancialPaymentScreen.tsx";
import { RosterUsersScreen } from "../atomic_design/templates/accountant/Roster/RosterUsersScreen.tsx";
import { RosterDetailScreen } from "../atomic_design/templates/accountant/Roster/RosterDetailScreen.tsx";
import { GeneralSummaryScreen } from "../atomic_design/templates/accountant/Summary/GeneralSummaryScreen.tsx";
import { ProfitDetailsScreen } from "../atomic_design/templates/accountant/Summary/ProfitDetailsScreen.tsx";
import { EquityDetailsScreen } from "../atomic_design/templates/accountant/Summary/EquityDetailsScreen.tsx";
import { BusinessExpensesDetailsScreen } from "../atomic_design/templates/accountant/Summary/BusinessExpensesDetailsScreen.tsx";
import { GrossProfitDetailsScreen } from "../atomic_design/templates/accountant/Summary/GrossProfitDetailsScreen.tsx";
import { IncomeScreen } from "../atomic_design/templates/accountant/incomes/IncomeScreen.tsx";
import { TaxtPaymentsScreen } from "../atomic_design/templates/accountant/Taxt/TaxtPaymentsScreen.tsx";
import { RegisterTaxtPaymentScreen } from "../atomic_design/templates/accountant/Taxt/RegisterTaxtPaymentScreen.tsx";
import { TaxtPaymentDetailsScreen } from "../atomic_design/templates/accountant/Taxt/TaxtPaymentDetailsScreen.tsx";
import { AnotherPaymentsScreen } from "../atomic_design/templates/accountant/AnotherPayment/AnotherPaymentsScreen.tsx";
import { RegisterAnotherPaymentScreen } from "../atomic_design/templates/accountant/AnotherPayment/RegisterAnotherPaymentScreen.tsx";
import { AnotherPaymentDetailsScreen } from "../atomic_design/templates/accountant/AnotherPayment/AnotherPaymentDetailsScreen.tsx";
import { AccountantPaymentsMenuScreen } from "../atomic_design/templates/accountant/AccountantPaymentsMenuScreen.tsx";
import { FinancialDebtPaymentHistoryScreen } from "../atomic_design/templates/accountant/FinancialDebt/FinancialDebtPaymentHistoryScreen.tsx";
import { FinancialPaymentDetailsScreen } from "../atomic_design/templates/accountant/FinancialDebt/FinancialPaymentDetailsScreen.tsx";
import { PayrollHistoryScreen } from "../atomic_design/templates/accountant/Roster/PayrollHistoryScreen.tsx";
import { PayrollPaymentDetailScreen } from "../atomic_design/templates/accountant/Roster/PayrollPaymentDetailScreen.tsx";
import { ForecastScreen } from "../atomic_design/templates/accountant/Forecast/ForecastScreen.tsx";
import { FinancialReportsScreen } from "../atomic_design/templates/accountant/FinancialReportsScreen.tsx";
import AcounterLayout from "./acounter/AcounterLayout.tsx";



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
        <Route path={ScreenPaths.uploadExcel} element={<UploadExcelScreen />} />

        {/* Rutas de admin */}
        <Route
          path={ScreenPaths.admin.home}
          element={
            <ProtectedAdmin>
              <AdminDashboard />
            </ProtectedAdmin>
          }
        />

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

        {/* Rutas de administracion de rutas */}
        <Route path="routes" element={<RouteAdministrationScreen />} />
        <Route path="routes/create" element={<CreateRouteScreen />} />
        <Route path="routes/edit/:routeId" element={<EditRouteScreen />} />

        {/* Rutas de administracion de cuentas bancarias */}
        <Route path="bank-accounts" element={<BankAccountsAdministrationScreen />} />

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

        {/* clientes de un cobrador */}
        <Route
          path={ScreenPaths.collector.costumers}
          element={<CollectorDebtsScreen />}
        />

        {/* deudas activas del cliente de un cobrador */}
        <Route
          path={ScreenPaths.collector.costumer(":id")}
          element={<CollectorDebtInstallmentsScreen />}
        />

        {/* cuotas de una deuda para el cobrador */}
        <Route
          path={ScreenPaths.collector.debtInstallments(":debtId")}
          element={<CollectorDebtInstallmentsScreen />}
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

        {/* rutas de auditor, operaciones del dia*/}
        <Route
          path={ScreenPaths.auditor.dailyOperations}
          element={<DailyOperationsScreen />}
        />

        {/* rutas de auditor, detalle de intento de cobro*/}
        <Route
          path={ScreenPaths.auditor.collectionAttemptDetail(":attemptId")}
          element={<CollectionAttemptDetailScreen />}
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


        {/*sesor de campo:  lista de visitas de un cliente*/}
        <Route
          path={ScreenPaths.advisor.field.visit.visits2(":documentCostumer")}
          element={<VisitListPage />}
        />
        <Route
          path={ScreenPaths.advisor.field.visit.visit(":visitId")}
          element={<FieldVisit />}
        />
        <Route
          path={ScreenPaths.advisor.field.visit.customer2(":costumerId")}
          element={<CostumerForm />}
        />
        <Route
          path={ScreenPaths.advisor.field.visit.Costumer(
            ":costumerId",
            ":visitId",
          )}
          element={<FieldVisit />}
        />
      </Route>


      {/* Rutas de Contabilidad */}
      <Route
        path={ScreenPaths.accountant.home}
        element={
          <ProtectedAuth>
            <ProtectedAccountant>
              <AcounterLayout />
            </ProtectedAccountant>
          </ProtectedAuth>
        }
      >
        {/* index */}
        <Route index element={
          <AccountantDashboard />
        }
        />


        <Route
          path={ScreenPaths.accountant.dailyOperations}
          element={

            <AccountantDailyOperations />

          }
        />

        <Route
          path={ScreenPaths.accountant.debits}
          element={

            <AccountantDebtsScreen />

          }
        />

        <Route
          path={ScreenPaths.accountant.debitsCustomer(":docCostumer")}
          element={

            <AccountantDebtsForCustomer />

          }
        />

        <Route
          path={ScreenPaths.accountant.payment(":paymentId")}
          element={

            <PaymentInvoiceScreen />

          }
        />

        <Route
          path={ScreenPaths.accountant.routesBalance}
          element={

            <RoutesBalanceScreen />

          }
        />

        <Route
          path={ScreenPaths.accountant.pendingDelivery}
          element={

            <AccountantPendingDeliveryScreen />

          }
        />

        <Route
          path={ScreenPaths.accountant.balanceSheet}
          element={

            <BalanceSheetScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.incomeRegistration}
          element={

            <IncomeRegistrationScreen />

          }
        />

        <Route
          path={ScreenPaths.accountant.incomes}
          element={

            <IncomeScreen />

          }
        />

        <Route
          path={ScreenPaths.accountant.financialDebtRegistration}
          element={

            <FinancialDebtRegistrationScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.financialDebts}
          element={

            <FinancialDebtsListScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.financialDebtEdit(":id")}
          element={

            <FinancialDebtRegistrationScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.financialDebtPayment(":id")}
          element={

            <CreateFinancialPaymentScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.rosterUsers}
          element={

            <RosterUsersScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.rosterDetail(":userId")}
          element={

            <RosterDetailScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.generalSummary}
          element={

            <GeneralSummaryScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.profitDetails}
          element={

            <ProfitDetailsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.grossProfitDetails}
          element={

            <GrossProfitDetailsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.equityDetails}
          element={

            <EquityDetailsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.businessExpenses}
          element={

            <BusinessExpensesDetailsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.taxtPayments}
          element={

            <TaxtPaymentsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.taxtPaymentRegistration}
          element={

            <RegisterTaxtPaymentScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.taxtPaymentDetails(":id")}
          element={

            <TaxtPaymentDetailsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.anotherPayments}
          element={

            <AnotherPaymentsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.anotherPaymentRegistration}
          element={

            <RegisterAnotherPaymentScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.anotherPaymentDetails(":id")}
          element={

            <AnotherPaymentDetailsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.paymentsMenu}
          element={

            <AccountantPaymentsMenuScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.financialDebtHistory(":debtId")}
          element={

            <FinancialDebtPaymentHistoryScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.financialPaymentDetail(":paymentId")}
          element={

            <FinancialPaymentDetailsScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.payrollHistory(":userId")}
          element={

            <PayrollHistoryScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.payrollPaymentDetail(":payrollId")}
          element={

            <PayrollPaymentDetailScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.forecasts}
          element={

            <ForecastScreen />

          }
        />
        <Route
          path={ScreenPaths.accountant.financialReports}
          element={

            <FinancialReportsScreen />

          }
        />
      </Route>
    </Routes>
  );
}
