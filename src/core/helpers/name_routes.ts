export type RoutNav = {
  label: string;
  path: string;
};


//inicio
export const pathHome = "/"

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
const pathAccountCreateDebits = pathAccountDebits




export const baseAppBar: RoutNav[] = [
  { label: "configuracion", path: pathConfiguration },
];

export const nameRoutesMap = new Map([
  ["/configuration", "configuracion"],
]);

export const ScreenPaths = {
  home: pathHome,
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
        Costumer: (idCostumer: string, idVisit: string) => `${pathCostumerField}/visits/${idVisit}/costumer/${idCostumer}`,
      },
    }
  },
  collector: {
    home: pathColllector,
    installment: (id: string) => `${pathColllectorInstallment}/${id}`,
    route: (id: string) => `${pathColllectorRoute}/${id}`,
    costumer: (id: string) => `${pathCollectorCostumer}/${id}`,
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

  },
  accountant: {
    home: pathAccountDebits,
    editDebit: (id: string) => `${pathAccountCreateDebits}/${id}`,
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

export const auditorAppBar: RoutNav[] = [
  { label: "clientes", path: ScreenPaths.auditor.costumers },
  { label: "desembolsos", path: ScreenPaths.auditor.home },
  { label: "inicio", path: ScreenPaths.home },
];