import type { requiredArrearsState } from "./core";

/**
 * DebtType representa el tipo de deuda \
 * fijo: el valor de la cuota se calcula el mismo dia de creacion y no cambia \
 * variable: el valor de la cuota se calcula a fecha de corte de la cuota anterior en base al capital actual del credito \
 */
export type DebtType = "fijo" | "variable";

/**
 * adelanto representa si la deuda se creo con un adelanto
 */
export type Prepayment = "si" | "no";

// alert- despues de desembolsar no permitir modificar las deudas \
//en_mora => credito vencido: una deuda que a paso de la fecha de vencimiento, esta deuda debe estar en un segmento de alerta \
/** tentativa: cuando el asesor crea una deuda \
 * preAprobada : cuando el asesor envia una deuda al auditor \
 * preparacion: cuando el auditor envia una deuda al contador \
 * activa: el contador da por desembolsada la deuda y el deudor pasa a deber a la empresa \
 * pagada: el deudor pago al totalidad de la deuda \
 * en_mora: la deuda tiene cuotas incompletas o en mora \
 * inactivo: se perdio contacto y metodos de cobro al cliente(al dar por cancelada una deuda se da por cancelado todas las cuotas que esten en mora, las cuotas incompletas y pagadas sigen teniendo su estado) \
 * anulado: es una deuda que se creo en el sistema pero que por algun motivo se anula, implica que la empresa no perdio dinero y el cliente no fue mala paga-   colocar en gris las casillas
 */
export type DebtStatus =
  | "tentativa"
  | "preAprobada"
  | "preparacion"
  | "activa"
  | "corregir"
  | "pagada"
  | "en_mora"
  | "inactivo"
  | "anulado"

/**
 * false_preparacion: cuando el credito no esta listo para desembolsarse al cliente \
 * true_preparacion: cuando el credito esta listo para desembolsarse al cliente \
 * entregado: cuando se entrego el desembolso al cliente \
 */
export type delivered_status =
  | "false_preparacion"
  | "true_preparacion"
  | "entregado"

/** tentativa: cuando el asesor crea una deuda \
* preAprobada : cuando el asesor envia una deuda al auditor \
* preparacion: cuando el auditor envia una deuda al contador \
* activa: el contador da por desembolsada la deuda y el deudor pasa a deber a la empresa \
* pagada: el deudor pago al totalidad de la deuda \
* en_mora: la deuda tiene cuotas incompletas o en mora \
* inactivo: se perdio contacto y metodos de cobro al cliente(al dar por cancelada una deuda se da por cancelado todas las cuotas que esten en mora, las cuotas incompletas y pagadas sigen teniendo su estado) \
* anulado: es una deuda que se creo en el sistema pero que por algun motivo se anula, implica que la empresa no perdio dinero y el cliente no fue mala paga-   colocar en gris las casillas
*/
export const debtStatusList: DebtStatus[] = [
  "tentativa",
  "preAprobada",
  "preparacion",
  "activa",
  "corregir",
  "pagada",
  "en_mora",
  "inactivo",
  "anulado",
];

/** 
 * la especificaciones de los dias de un termino y dias del mes de un termino se especifican en el archivo diasPorTermino.ts
 */
export type DebtTerms = "diario" | "semanal" | "quincenal" | "mensual";

/**con  installmentsPaid podemos saber cual es la siguiente cuota que debe ser cobrada*/
export interface Debt {
  // --- IDENTIFICACIÓN Y RUTA ---
  /**id unico de la deuda*/
  id: string;
  /**nombre de la deuda, debt-001*/
  name: string;

  /**tasa de interes para retraso*/
  lateInterestRate: number

  /**
   *tipo de deuda \
   * fijo: el valor de la cuota se calcula el mismo dia de creacion y no cambia \
   * variable: el valor de la cuota se calcula a fecha de corte de la cuota anterior en base al capital actual del credito \
  */
  type: DebtType;
  /**estado de la deuda \
 * tentativa: cuando el asesor crea una deuda \
 * preAprobada : cuando el asesor envia una deuda al auditor \
 * preparacion: cuando el auditor envia una deuda al contador \
 * activa: el contador da por desembolsada la deuda y el deudor pasa a deber a la empresa \
 * pagada: el deudor pago al totalidad de la deuda \
 * en_mora: la deuda tiene cuotas incompletas o en mora \
 * inactivo: se perdio contacto y metodos de cobro al cliente(al dar por cancelada una deuda se da por cancelado todas las cuotas que esten en mora, las cuotas incompletas y pagadas sigen teniendo su estado) \
 * anulado: es una deuda que se creo en el sistema pero que por algun motivo se anula, implica que la empresa no perdio dinero y el cliente no fue mala paga-   colocar en gris las casillas
  */
  status: DebtStatus;

  // --- DESEMBOLSO Y ENTREGA ---
  /**indica si el credito sigue vivo
   * false: cuando el credito esta anulado, pagado, tentativa, preAprobada, preparacion, corregir
   * true: cuando el credito esta activo
   */
  isLife: boolean;

  /*id de la ruta a la que esta enlazada la deuda* */
  routeId: string;

  /**indica que la deuda esta relacionada con una visita, util para crear una deuda a la vez que una visita, una visita puede tener varias deudas */
  idVisit?: string;

  /**indica si la deuda se creo con un adelanto */
  prepayment?: Prepayment;

  // --- INFORMACIÓN DEL CLIENTE ---
  /**id del cliente */
  clientId: string;

  /**nombre del cliente */
  clientName: string;

  /**documento del costumer*/
  clientDocument: string;

  // --- CONDICIONES FINANCIERAS Y TÉRMINOS ---
  /**para calcular cuanto paga el installment en base al interestRate y la frecuencia seleccionada para los pagos de las cuotas 
   *  DebtTerms = "diario" | "semanal" | "quincenal" | "mensual"
  */
  debtTerms: DebtTerms;

  /**representa el numero de dias que tiene un mes para el credito */
  daysPerMonth: number;

  /**tasa de interes */
  interestRate: number;

  /** total del capital prestado sin intereses */
  capital: number;

  /**total de intereses que genera la deuda*/
  interest: number;

  /**total del prestamo pedido con intereses (capital + interes) */
  amount: number;

  /**indica el total de la mora a pagarse*/
  arrears: number;

  /**total de la deuda (capital + interes + mora) */
  total: number

  /**representa las ganancias por papeleria */
  processingFee: number;

  // --- DESEMBOLSO Y ENTREGA ---
  /**indica si el dinero de la deuda fue entregado al cliente */
  delivered: boolean;

  /**indica si la deuda esta lista para desembolsar al cliente */
  deliveredStatus: delivered_status;

  // --- GARANTÍAS Y PRENDA ---
  /**indica si ha alguna prenda relacionada con el credito*/
  pledge: boolean;

  /**descripcion de la prenda*/
  pledgeDescription?: string;

  /**valor de la prenda*/
  pledgeValue?: number;

  // --- SEGUIMIENTO DE PAGOS Y SALDOS ---

  //pagados

  /**capital pagado hasta el momento*/
  capitalPaid: number;

  /**interes pagado hasta el momento*/
  interestPaid: number;

  /**monto pagado hasta el momento(capital+interes)*/
  amountPaid: number;

  /**mora pagada hasta el momento*/
  arrearsPaid: number;

  /**total pagado hasta el momento (capital+interes+mora) */
  totalPaid: number;

  //restante por pagar
  /**capital restante por pagar*/
  remainingCapitalToPay: number;

  /**interes restante por pagar*/
  remainingInterestToPay: number;

  /**monto restante por pagar(capital + intereses)*/
  remainingAmountToPay: number;

  /**mora restante por pagar*/
  remainingArrearsToPay: number;

  /**total del prestamo restante por pagar(capital + intereses + mora) */
  remainingTotalToPay: number;

  //pocentaje pagado

  /**porcentaje de capital pagado*/
  percentageOfCapitalPaid: number;

  /**porcentaje de interes pagado*/
  percentageOfInteresPaid: number;

  /**porcentaje de monto pagado (capital + interes)*/
  percentageOfAmountPaid: number;

  /**porcentaje de mora pagada */
  porcentageOfArrearsPaid: number;

  /**porcentaje de total pagado (capital + interes + mora)*/
  percentageOfTotalPaid: number;

  // --- GESTIÓN DE MORA Y RETRASO ---

  /**Cantidad de cuotas vencidas actualmente */
  numberOfArrearsInstallments: number;

  /**cantidad de dias de mora actual*/
  numberOfArrearsDays: number;

  /**indica si es obligatorio el pago de algun tipo de mora para marcar en automatico como pagada */
  requiredArrears: requiredArrearsState;

  /**indica si hay o no que pagar algun tipo de mora para marcar en automatico como pagada \
   * true: es necesario algun tipo de pago de mora \
   * false: no es encesario ningun tipo de pago por mora
  */
  requiredState: boolean;

  /**maximo de dias de mora que se registro en la deuda*/
  maxNumberOfArrearsDays: number;

  /**total de dias de mora registrados en el transcurso de la vida de la deuda*/
  totalArrearsDays: number;

  // --- CUOTAS Y FECHAS (yyyy-mm-dd) ---
  /**numero de cuotas del credito*/
  installmentCount: number;

  /**numero de cuotas pagadas(se basa en el estado de pagada, no en si se pago el monto o total de la cuota)*/
  installmentsPaid: number;

  /**fecha de creacion de prestamo */
  createdAt: string;

  /**fecha de inicio de prestamo, difiere de creacion ya que la creacion y la oficializacion pueden variar. */
  startDate: string;

  /**fecha del proximo pago que debe ser cancelado, si esta fecha es menor o igual a la fecha actual indica que la deuda esta en mora, si es valor esta vacio indica que la deuda fue pagada */
  nextPaymentDue: string;

  /**fecha del ultimo pago depositado*/
  dateLastPayment?: string;

  /**tasa de interes de mora 
   * indica cuanto se le cobra de interes a la deuda por cada dia en mora
   * es un valor porcentual
   * */
  arrearsInterestRate: number;

  /**fecha estimada de finalizacion del pago de la deuda*/
  expectedEndDate: string;

  /**fecha en la que se cerro la deuda(pagada/renovada)*/
  closedAt?: string;

  // --- RENOVACIONES ---
  /**indica el valor pagado de la deuda por concepto de renovacion */
  renewalPayment: number;

  /** id de la deuda original en caso de ser una renovacion */
  originalDebt?: string;

  /** id de la nueva deuda que se creo como renovacion de esta */
  renewedToDebtId?: string;

  // --- OBSERVACIONES Y NOTAS ---
  /**observaciones del recaudador*/
  collectorNotes?: string;

  /**observaciones del auditor*/
  auditorNotes?: string;

  /**observaciones del contador*/
  accountantNotes?: string;

  /**observaciones del asesor comercial*/
  advisorNotes?: string;
}

export function createEmptyDebt(): Debt {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: "",
    requiredArrears: "no",
    requiredState: false,
    isLife: true,
    lateInterestRate: 0,
    numberOfArrearsDays: 0,
    maxNumberOfArrearsDays: 0,
    arrearsInterestRate: 0,
    numberOfArrearsInstallments: 0,
    expectedEndDate: today,
    nextPaymentDue: today,
    pledge: false,
    deliveredStatus: "false_preparacion",
    routeId: "",
    type: "fijo",
    renewalPayment: 0,
    delivered: false,
    debtTerms: "diario",
    name: "createEmptyDebt",
    daysPerMonth: 30,
    status: "tentativa",
    totalArrearsDays: 0,

    capital: 0,
    interest: 0,
    amount: 0,
    arrears: 0,
    total: 0,

    percentageOfCapitalPaid: 100,
    percentageOfInteresPaid: 100,
    percentageOfAmountPaid: 100,
    porcentageOfArrearsPaid: 100,
    percentageOfTotalPaid: 100,

    remainingCapitalToPay: 0,
    remainingInterestToPay: 0,
    remainingAmountToPay: 0,
    remainingArrearsToPay: 0,
    remainingTotalToPay: 0,

    capitalPaid: 0,
    interestPaid: 0,
    amountPaid: 0,
    arrearsPaid: 0,
    totalPaid: 0,

    interestRate: 0,
    processingFee: 0,
    startDate: today,
    createdAt: today,
    installmentCount: 0,
    installmentsPaid: 0,
    clientId: "",
    clientName: "createEmptyDebt",
    clientDocument: "",
  };
}


/**indica si el dinero se entrego al cliente */
export const debtStatusDelivered: DebtStatus[] = [
  "activa",
  "pagada",
  "en_mora",
  "inactivo",
];

/**
 * realiza una copia profunda de la deuda la cual es indpeendiente del objeto pasado
 */
export const cloneDebt = (debt: Debt): Debt => {
  // Utiliza structuredClone si el entorno lo soporta (Nativo en navegadores modernos y Node.js 17+)
  if (typeof structuredClone === "function") {
    return structuredClone(debt);
  }

  // Copia profunda manual en caso de entornos legacy
  return {
    ...debt,
  }
};
