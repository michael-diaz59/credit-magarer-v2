export type RoutNav = {
  label: string;
  path: string;
};


//inicio
export const pathHome = "/"

//configuracion
export const pathConfiguration = "/configuration"

//pantalla asesor
export const pathAdvisor = "/advisor"

//pantalla asesor de oficina
export const pathOfficeAdvisor = pathAdvisor + "/office"

const pathOfficeDebits=pathOfficeAdvisor+"/debits"
const pathOfficeCreateDebit=pathOfficeAdvisor+"/debits/create"
const pathOfficeDebit=pathOfficeAdvisor+"/debits"

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
export const pathVisitField  = pathVisitsField


const pathColllector="/collector"

const pathColllectorRoutes=pathColllector+"/routes"

const pathColllectorRoute=pathColllectorRoutes

const pathCollectorCostumer=pathColllector+"/costumer"

const pathAuditor= "/auditor"

const pathAuditorDebits= pathAuditor+"/debits"
const pathAuditorDebit= pathAuditorDebits
const pathAuditorCostumers= pathAuditor+"/costumers"
const pathAuditorCostumer= pathAuditorCostumers

const pathAccountant="/accountant"
const pathAccountDebits= pathAccountant+"/debits"
const pathAccountCreateDebits= pathAccountDebits




export const baseAppBar: RoutNav[] = [
  { label: "ligas", path: "/league" },
  { label: "torneos", path: "/tournament" },
  { label: "participantes", path: "/participants" },
  { label: "configuracion", path: pathConfiguration },
];




export const nameRoutesMap = new Map([
  ["/league", "ligas"],
  ["/tournament", "torneos"],
  ["/participants", "participantes"],
  ["/configuration", "configuracion"],
]);

export const ScreenPaths = {
  home: pathHome,
  Configuration: pathConfiguration,
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
        CreateVisit: pathCreateVisit,
        visit:(id: string) => `${pathOfficeVisit}/${id}`,
        Costumer: (idCostumer: string,idVisit:string) => `${pathCostumer}/visits/${idVisit}/costumer/${idCostumer}`,
      },
       debit: {
        debits: pathOfficeDebits,
        CreateDebits: pathOfficeCreateDebit,
        debit:(debitId: string) => `${pathOfficeDebit}/${debitId}`,
      },
    },
    field: {
      home: pathFieldAdvisor,
        visit: {
        visits: pathVisitsField,
        visit:(id: string) => `${pathVisitField}/${id}`,
        Costumer: (idCostumer: string,idVisit:string) => `${pathCostumerField}/visits/${idVisit}/costumer/${idCostumer}`,
      },
    }
  },
  collector:{
    home:pathColllectorRoutes,
    route:(id: string) => `${pathColllectorRoute}/${id}`,
    costumer: (id: string) => `${pathCollectorCostumer}/${id}`,
  },
  auditor:{
    home:pathAuditorDebits,
    debit:(id: string) =>  `${pathAuditorDebit}/${id}`,
    costumers:pathAuditorCostumers,
    costumer:(id: string) =>   `${pathAuditorCostumer}/${id}`,

  },
  accountant:{
    home:pathAccountDebits,
    editDebit:(id: string) => `${pathAccountCreateDebits}/${id}`, 
  }

} as const;

export const officeAdvisorAppBar: RoutNav[] = [
  { label: "clientes", path: ScreenPaths.advisor.office.costumer.costumers },
  { label: "desembolsos", path: ScreenPaths.advisor.office.debit.debits},
  { label: "visitas", path: ScreenPaths.advisor.office.visit.visits },
  { label: "inicio", path: ScreenPaths.home },
];