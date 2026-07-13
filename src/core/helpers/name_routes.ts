export type RoutNav = {
  label: string;
  path: string;
  exact?: boolean;
};


//inicio
export const pathHome = "/"

export const pathUploadExcel = "/upload-excel"

//log in
export const pathLog = "/log"

//log in
export const pathLogIn = pathLog + "/login"

//configuracion
export const pathConfiguration = "/configuration"

//pantalla asesor
export const pathAdvisor = "/advisor"

//pantalla asesor de oficina
export const pathOfficeAdvisor = pathAdvisor + "/office"

const pathOfficeDebits = pathOfficeAdvisor + "/debits"
const pathOfficeCreateDebit = pathOfficeAdvisor + "/debits/create"
const pathOfficeDebit = pathOfficeAdvisor + "/debits"

//lista de clinetes
export const pathOfficeCostumers = pathOfficeAdvisor + "/costumers"

//cliente, se debe añadir el id al final
export const pathCostumer = pathOfficeCostumers

//crear usuario
export const pathcreateCostumer = pathOfficeCostumers + "/createCostumer"

// ver lista de visistas
export const pathOfficeVisits = pathOfficeAdvisor + "/visits"

// ver/editar visita, se debe añadir el id
export const pathOfficeVisit = pathOfficeVisits

//crear visita
export const pathCreateVisit = pathOfficeVisits + "/create"





//pantalla asesor de campo
export const pathFieldAdvisor = pathAdvisor + "/field"

// ver lista de visistas
export const pathVisitsField = pathFieldAdvisor + "/visits"

// ver costumer
export const pathCostumerField = pathFieldAdvisor

//ver detalle de visita
export const pathVisitField = pathVisitsField


const pathColllector = "/collector"

const pathCollectorCostumers = pathColllector + "/costumers"
const pathColllectorInstallment = pathColllector + "/installment"

const pathColllectorRoutes = pathColllector + "/routes"

const pathColllectorRoute = pathColllectorRoutes

const pathCollectorCostumer = pathColllector + "/costumer"

const pathAuditor = "/auditor"

const pathAuditorinstallments = pathAuditor + "/installments"
const pathAuditorpayments = pathAuditor + "/payments"
const pathAuditorpayment = pathAuditor + "/payment"

const pathAuditorDebits = pathAuditor + "/debits"
const pathAuditorDebit = pathAuditorDebits
const pathAuditorCostumers = pathAuditor + "/costumers"
const pathAuditorCostumer = pathAuditorCostumers

const pathAccountant = "/accountant"
const pathAccountDebits = pathAccountant + "/debits"
const pathAccountPayment = pathAccountant + "/payment"
const pathAccountDebitsCustomer = pathAccountant + "/debits/forCustomers"
const pathAccountDailyOperations = pathAccountant + "/daily-operations"
const pathAccountIncomes = pathAccountant + "/incomes"
const pathAccountIncomeRegistration = pathAccountant + "/income-registration"
const pathAccountFinancialDebtRegistration = pathAccountant + "/financial-debt-registration"
const pathAccountFinancialDebts = pathAccountant + "/financials"
const pathAccountFinancialDebtPayment = pathAccountant + "/financials/payment"
const pathAccountRoster = pathAccountant + "/roster"
const pathAccountGeneralSummary = pathAccountant + "/general-summary"
const pathAccountProfitDetails = pathAccountant + "/profit-details"
const pathAccountEquityDetails = pathAccountant + "/equity-details"
const pathAccountGrossProfitDetails = pathAccountant + "/gross-profit-details"
const pathAccountTaxtPayments = pathAccountant + "/taxt-payments"
const pathAccountTaxtPaymentRegistration = pathAccountant + "/taxt-payment-registration"
const pathAccountAnotherPayments = pathAccountant + "/another-payments"
const pathAccountAnotherPaymentRegistration = pathAccountant + "/another-payment-registration"
const pathAccountPaymentsMenu = pathAccountant + "/payments-menu"
const pathAccountBusinessExpenses = pathAccountant + "/business-expenses"
const pathAccountFinancialDebtHistory = pathAccountant + "/financial-debt-history"
const pathAccountFinancialPaymentDetail = pathAccountant + "/financial-payment-detail"
const pathAccountPayrollHistory = pathAccountant + "/payroll-history"
export const pathAccountPayrollPaymentDetail = pathAccountant + "/payroll-payment-detail"
export const pathAccountForecasts = pathAccountant + "/forecasts"

const pathAdmin = "/admin"


export const baseAppBar: RoutNav[] = [
  { label: "configuracion", path: pathConfiguration },
];

export const nameRoutesMap = new Map([
  ["/configuration", "configuracion"],
]);

export const ScreenPaths = {
  home: pathHome,
  uploadExcel: pathUploadExcel,
  log: {
    logIn: pathLogIn
  },
  Configuration: {
    home: pathConfiguration
  },
  advisor: {
    home: pathAdvisor,
    office: {
      home: pathOfficeAdvisor,
      costumer: {
        costumers: pathOfficeCostumers,
        createCostumer: pathcreateCostumer,
        costumer: (id: string) => `${pathCostumer}/${id}`
      },
      visit: {
        visits: pathOfficeVisits,
        visits2: (documentCostumer: string) => pathOfficeVisits + `2/${documentCostumer}`,
        CreateVisit: pathCreateVisit,
        CreateVisit2: (documentCostumer: string) => pathCreateVisit + `2/${documentCostumer}`,
        visit: (id: string) => `${pathOfficeVisit}/${id}`,
        Costumer: (idCostumer: string, idVisit: string) => `${pathCostumer}/visits/${idVisit}/costumer/${idCostumer}`,
      },
      debit: {
        debits: pathOfficeDebits,
        CreateDebits: pathOfficeCreateDebit,
        debit: (debitId: string) => `${pathOfficeDebit}/${debitId}`,
      },
    },
    field: {
      home: pathFieldAdvisor,
      visit: {
        visits: pathVisitsField,
        visits2: (documentCostumer: string) => pathVisitsField + `2/${documentCostumer}`,
        visit: (id: string) => `${pathVisitField}/${id}`,
        customer2: (idCostumer: string) => `${pathCostumerField}/costumer2/${idCostumer}`,
        Costumer: (idCostumer: string, idVisit: string) => `${pathCostumerField}/visits/${idVisit}/costumer/${idCostumer}`,
      },
    }
  },
  collector: {
    home: pathColllector,
    installment: (id: string) => `${pathColllectorInstallment}/${id}`,
    debtInstallments: (debtId: string) => `${pathColllector}/debt/${debtId}/installments`,
    route: (id: string) => `${pathColllectorRoute}/${id}`,
    costumer: (id: string) => `${pathCollectorCostumer}/${id}`,
    costumers: pathCollectorCostumers,
  },
  auditor: {
    home: pathAuditor,
    debitsCustomer: (docCostumer: string) => `${pathAuditorDebit}/forCustomers/${docCostumer}`,
    debitsC: pathAuditorDebit + "/forCustomers",
    debitsS: pathAuditorDebit + "/forStates",
    debit: (debitId: string) => `${pathAuditorDebit}/${debitId}`,
    costumers: pathAuditorCostumers,
    customer: (idCustomer: string) => `${pathAuditorCostumer}/${idCustomer}`,
    installments: (idDebt: string) => `${pathAuditorinstallments}/${idDebt}`,
    payments: (idInstallment: string) => `${pathAuditorpayments}/${idInstallment}`,
    payment: (idInstallment: string) => `${pathAuditorpayment}/${idInstallment}`,
    dailyOperations: pathAuditor + "/daily-operations",
    collectionAttemptDetail: (id: string) => `${pathAuditor}/collection-attempt/${id}`,

  },
  accountant: {
    home: pathAccountant,
    debits: pathAccountDebits,
    debitsCustomer: (docCostumer: string) => `${pathAccountDebitsCustomer}/${docCostumer}`,
    debitsC: pathAccountDebitsCustomer,
    dailyOperations: pathAccountDailyOperations,
    payment: (id: string) => `${pathAccountPayment}/${id}`,
    routesBalance: pathAccountant + "/routes-balance",
    balanceSheet: pathAccountant + "/balance-sheet",
    pendingDelivery: pathAccountant + "/pending-delivery",
    incomeRegistration: pathAccountIncomeRegistration,
    incomeDetails: (id: string) => `${pathAccountIncomes}/${id}`,
    incomes: pathAccountIncomes,
    financialDebtRegistration: pathAccountFinancialDebtRegistration,
    financialDebts: pathAccountFinancialDebts,
    financialDebtEdit: (id: string) => `${pathAccountFinancialDebts}/edit/${id}`,
    financialDebtPayment: (id: string) => `${pathAccountFinancialDebtPayment}/${id}`,
    rosterUsers: pathAccountRoster,
    rosterDetail: (userId: string) => `${pathAccountRoster}/detail/${userId}`,
    generalSummary: pathAccountGeneralSummary,
    profitDetails: pathAccountProfitDetails,
    grossProfitDetails: pathAccountGrossProfitDetails,
    equityDetails: pathAccountEquityDetails,
    taxtPayments: pathAccountTaxtPayments,
    taxtPaymentRegistration: pathAccountTaxtPaymentRegistration,
    taxtPaymentDetails: (id: string) => `${pathAccountTaxtPayments}/${id}`,
    anotherPayments: pathAccountAnotherPayments,
    anotherPaymentRegistration: pathAccountAnotherPaymentRegistration,
    anotherPaymentDetails: (id: string) => `${pathAccountAnotherPayments}/${id}`,
    paymentsMenu: pathAccountPaymentsMenu,
    businessExpenses: pathAccountBusinessExpenses,
    financialDebtHistory: (debtId: string) => `${pathAccountFinancialDebtHistory}/${debtId}`,
    financialPaymentDetail: (paymentId: string) => `${pathAccountFinancialPaymentDetail}/${paymentId}`,
    payrollHistory: (userId: string) => `${pathAccountPayrollHistory}/${userId}`,
    payrollPaymentDetail: (payrollId: string) => `${pathAccountPayrollPaymentDetail}/${payrollId}`,
    forecasts: pathAccountForecasts,
    financialReports: pathAccountant + "/financial-reports",
  },
  admin: {
    home: pathAdmin,
  }

} as const;

export const officeAdvisorAppBar: RoutNav[] = [
  { label: "clientes", path: ScreenPaths.advisor.office.costumer.costumers },
  { label: "desembolsos", path: ScreenPaths.advisor.office.debit.debits },
  { label: "visitas", path: ScreenPaths.advisor.office.visit.visits },
  { label: "inicio", path: ScreenPaths.home },
];

export const basphatsAppBar: RoutNav[] = [
  { label: "configuracion", path: ScreenPaths.Configuration.home },
  { label: "inicio", path: ScreenPaths.home },
];

export const collectorAppBar: RoutNav[] = [
  { label: "perfil", path: ScreenPaths.Configuration.home },
  { label: "cobros", path: ScreenPaths.collector.home, exact: true },
  { label: "clientes", path: ScreenPaths.collector.costumers },
  { label: "inicio", path: ScreenPaths.home, exact: true },
];

export const auditorAppBar: RoutNav[] = [
  { label: "clientes", path: ScreenPaths.auditor.debitsC },
  { label: "desembolsos", path: ScreenPaths.auditor.home },
  { label: "inicio", path: ScreenPaths.home },
];

export const accountantAppBar: RoutNav[] = [
  { label: "inicio", path: ScreenPaths.home },
  { label: "dashboard", path: ScreenPaths.accountant.home },
  { label: "cuadres movimientos", path: ScreenPaths.accountant.dailyOperations },
  { label: "creditos", path: ScreenPaths.accountant.debits },
  { label: "rutas", path: ScreenPaths.accountant.routesBalance },
  { label: "entregas péndientes", path: ScreenPaths.accountant.pendingDelivery },
  { label: "reportes", path: ScreenPaths.accountant.financialReports },
];