export type DebtType = "credito" | "prenda";


// alert- despues de desembolsar no permitir modificar las deudas
//en_mora => credito vencido: una deuda que a paso de la fecha de vencimiento, esta deuda debe estar en un segmento de alerta
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

export type delivered_status =
  | "false_preparacion"
  | "true_preparacion"
  | "entregado"

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
  id: string;

  /*id de la ruta a la que etsa enlazada la deuda* */
  routeId: string

  type: DebtType;

  /**indica que la deuda esta relacionada con una visita, util para crear una deuda a la vez que una visita, una visita puede tener varias deudas */
  idVisit: string;

  /**para calcular cuanto paga el installment en base al interestRate y la frecuencia seleccionada para los pagos de las cuotas */
  debtTerms: DebtTerms;

  name: string;

  /**representa el numero de dias que tiene un mes para esta deuda */
  diasMes: number,

  status: DebtStatus;

  /**indica si el dinero de la deuda fue entregado al cliente */
  delivered: boolean;

  /**indica si la deuda esta lista para desembolsar al cliente */
  deliveredStatus: delivered_status;


  /**indica el valor pagado de la deuda por concepto de renovacion */
  renewalPayment: number;

  /** total del capital prestado sin intereses */
  capital: number;

  /**total de intereses que genera la deuda*/
  totalInterest: number;

  /**total del prestamo pedido con intereses (capital + totalInterest) */
  totalAmount: number;

  /**indica si la deuda se termino de pagar en termno porcential 1 a 100 (capital + interes sin contar retraso)*/
  creditPaid: number;

  /**indica si el capital de la deuda se termino de pagar en termno porcential 1 a 100*/
  capitalPaid: number;
  /**indica si el interes de la deuda se termino de pagar en termno porcential 1 a 100*/
  interestPaid: number;

  /**total pagado hasta el momento por base de cuotas */
  totalPaid: number;

  /**restante para completar pago de credito( capital + intereses pendientes) no toma en cuenta mora*/
  remainingToCompleteCredit: number;

  /** total pagado por interes de mora de la deuda */
  totalPaymentForLate: number;

  /**tasa de interes */
  interestRate: number;


  /**representa las ganancias por papeleria */
  papeleria: number;

  //fechas yyyy-mm-dd

  /**fecha de inicio de prestamo, difiere de creacion ya que la creacion y la oficializacion pueden variar. */
  startDate: string;

  /**fecha de creacion de prestamo */
  createdAt: string;

  /**fecha de vencimiento */
  firstDueDate: string;




  /**numero de cuotas de una deuda*/
  installmentCount: number;



  /**fecha del proximo pago que debe ser cancelado, si esta fecha es menor o igual a la fecha actual indica que la deuda esta en mora, si es valor esta vacio indica que la deuda fue pagada */
  nextPaymentDue: string;

  /**fecha del ultimo pago */
  dateLastPayment: string;

  /**numero de cuotas pagadas en la totalidad de su base*/
  installmentsPaid: number;

  /**  Cantidad de cuotas vencidas actualmente */
  overdueInstallmentsCount: number;



  /**id del costumer */
  clientId: string;

  costumerName: string;

  /**documento del costumer*/
  costumerDocument: string;



  /** id de la deuda original en caso de ser una renovacion */
  originalDebt?: string;

  /** id de la nueva deuda que se creo como renovacion de esta */
  renewedToDebtId?: string;
}

export function createEmptyDebt(): Debt {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: "",
    capitalPaid: 0,
    interestPaid: 0,
    totalInterest: 0,
    remainingToCompleteCredit: 0,
    deliveredStatus: "false_preparacion",
    routeId: "",
    type: "credito",
    renewalPayment: 0,
    creditPaid: 0,
    delivered: false,
    idVisit: "",
    debtTerms: "diario",
    name: "",
    diasMes: 30,
    status: "tentativa",

    capital: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalPaymentForLate: 0,
    interestRate: 0,
    papeleria: 0,

    startDate: today,
    createdAt: today,
    firstDueDate: "",

    installmentCount: 1,

    nextPaymentDue: "",
    dateLastPayment: "",
    installmentsPaid: 0,
    overdueInstallmentsCount: 0,

    clientId: "",
    costumerName: "",
    costumerDocument: "",

    originalDebt: "",
    renewedToDebtId: "",
  };
}

// no actualizar sin tomar en cuenta los casos de uso que la llaman
export function createBasicDebt(): Debt {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: "",
    capitalPaid: 0,
    interestPaid: 0,
    totalInterest: 0,
    remainingToCompleteCredit: 0,
    deliveredStatus: "false_preparacion",
    routeId: "",
    creditPaid: 0,
    type: "credito",
    renewalPayment: 0,
    delivered: false,
    idVisit: "",
    debtTerms: "diario",
    name: "",
    diasMes: 30,
    status: "tentativa",

    capital: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalPaymentForLate: 0,
    interestRate: 0,
    papeleria: 0,

    startDate: today,
    createdAt: today,
    firstDueDate: "",

    installmentCount: 1,

    nextPaymentDue: "",
    dateLastPayment: "",
    installmentsPaid: 0,
    overdueInstallmentsCount: 0,

    clientId: "",
    costumerName: "",
    costumerDocument: "",

    originalDebt: "",
    renewedToDebtId: "",
  };
}


/**indica si el dinero se entrego al cliente */
export const debtStatusDelivered: DebtStatus[] = [
  "activa",
  "pagada",
  "en_mora",
  "inactivo",
];

export function isDebtStatusDelivered(status: DebtStatus) {
  return debtStatusDelivered.includes(status);
}