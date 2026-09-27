import type { Address, LocationGPS } from "../../../../costumers/domain/business/entities/Address";
import type { requiredArrearsState } from "./core";
import type { DebtType } from "./Debt";


/**
 * el estado de una cuota: \
 * pendiente: la cuota no se ha pagado  \
 * pagada: la cuota se marco como pagada  \
 * negociada: la cuota se negocia por acuerdo con el cliente y se deja de cobrar \
 * adelantada: la cuota se completo antes de la fecha de corte anterior, asi que no se cobran intereses(si es fija) \
 * renovada: la cuota se renovo por acuerdo con el cliente \
 * inactivo: la cuota se inactivo
*/
export type InstallmentStatus =
  | 'pendiente'
  | 'pagada'
  | 'negociada'
  | 'adelantada'
  | 'renovada'
  | 'inactivo';


/**
 * genera uan copia de un installment independiente a la original
 * @param original valor de tipo Installment 
 * @returns una copia exacta de la cuota proporcionada
 */
export function cloneInstallment(original: Installment): Installment {
  return structuredClone(original);
}

/**representa la cuota a pagar, este se usa en el modulo de cobrador para ver las rutas 
 * 
 * los datos como intentos de cobro y tipos de pago se buscan a travez de filtros de payments y attemptCollection
*/
export interface Installment {
  // --- IDENTIFICACIÓN Y RUTA ---
  /**id de la cuota */
  id: string;

  /**id de la deuda */
  debtId: string;

  /**id de la comañia usada para las reglas de seguridad de grupos */
  companyId: string;

  /**id de la ruta asignada */
  routeId: string;

  /**nombre de la ruta a la que esta enlazada la deuda */
  routeName: string;

  /**total de cuotas de la deuda */
  installmentTotalNumber: number; // 6

  /**numero de cuota en la deuda */
  installmentNumber: number; // 1, 2, 3...

  // --- INFORMACIÓN DEL CLIENTE ---
  /**id del cliente*/
  clientId: string;

  /**nombre del cliente */
  clientName: string;

  /** cedula del cliente */
  clientDocument: string;

  /**celular del cliente */
  clientNumber: string;

  /**direccion del cliente */
  clientAddres: Address;

  // --- CONDICIONES FINANCIERAS Y TÉRMINOS ---
  /**tasa de interes*/
  interestRate: number;

  /**tasa de interes de mora 
  * indica cuanto se le cobra de interes a la deuda por cada dia en mora
  * es un valor porcentual
  * */
  arrearsInterestRate: number;

  /**
   *tipo de deuda \
   * fijo: el valor de la cuota se calcula el mismo dia de creacion y no cambia \
   * variable: el valor de la cuota se calcula a fecha de corte de la cuota anterior en base al capital actual del credito \
  */
  type: DebtType;

  // --- VALORES BASE DE LA CUOTA ---
  /**capital generado por la cuota */
  capital: number;

  /**interes generado por la cuota */
  interest: number;

  /**valor de la cuota generado (capital + interes)*/
  amount: number;

  /**mora generada por la cuota */
  arrears: number;

  /**mora generada por aplazamiento formal */
  deferment: number;

  /**total de la cuota (capital + interes + mora)*/
  total: number;

  // --- SEGUIMIENTO DE PAGOS (MONTO PAGADO) ---
  /**dinero pagado por capital */
  capitalPaid: number;

  /**dinero pagado por intereses */
  interestPaid: number;

  /**monto pagado de la cuota (capital + interes)*/
  amountPaid: number;

  /**dinero pagado por mora */
  arrearsPaid: number;

  /**dinero pagado por aplazamiento */
  defermentPaid: number;

  /**total pagado de la cuota (capital + interes + mora)*/
  totalPaid: number;

  // --- PORCENTAJES DE PAGO ---
  /**porcentaje pagado del capital */
  percentageOfCapitalPaid: number;

  /**porcentaje pagado de los intereses */
  percentageOfInterestPaid: number;

  /**porcentaje pagado de la cuota (capital + interes)*/
  percentageOfAmountPaid: number;

  /**porcentaje pagado de la mora */
  porcentageOfArrearsPaid: number;

  /**porcentaje pagado de aplazamiento */
  percentageOfDefermentPaid: number;

  /**porcentaje pagado de la cuota (capital + interes + mora)*/
  percentageOfTotalPaid: number;

  // --- RESTANTE POR PAGAR ---
  /**capital restante por pagar */
  remainingCapitalToPay: number;

  /**interes restante por pagar */
  remainingInterestToPay: number;

  /**valor de la cuota restante por pagar(capital + interes)*/
  remainingAmountToPay: number;

  /**mora restante por pagar */
  remainingArrearsToPay: number;

  /**aplazamiento restante por pagar */
  remainingDefermentToPay: number;

  /**total restante de la cuota por pagar(capital + interes + mora)*/
  remainingTotalToPay: number;

  // --- GESTIÓN DE MORA Y RETRASO ---
  /**cantidad de dias de mora actual*/
  numberOfArrearsDays: number;

  /**nueva fecha de pago con aplazamiento*/
  defermentDueDate?: string;

  /**cantidad de dias de aplazamiento*/
  defermentDays: number

  /**indica si es obligatorio el pago de algun tipo de mora para marcar en automatico como pagada */
  requiredArrears: requiredArrearsState;

  /**indica si hay o no que pagar algun tipo de mora para marcar en automatico como pagada \
   * true: es necesario algun tipo de pago de mora \
   * false: no es encesario ningun tipo de pago por mora
  */
  requiredState: boolean;

  // --- ESTADO, FECHAS Y PAGOS ---
  /**el estado de una cuota: \
   * pendiente: la cuota no se ha pagado  \
   * pagada: la cuota se marco como pagada  \
   * incompleto: la cuota esta incompleta \
   * cancelada: la deuda se cancelo \
   * liquidada: la cuota se liquido por acuerdo con el cliente \
   * renovada: la cuota se renovo por acuerdo con el cliente */
  status: InstallmentStatus;

  /**indica si la cuota sigue viva, paa saber si el cobrador debe gestionarla
   * false: cuando la cuota esta pagada, liquidada, cancelada, renovada
   * true: cuando la cuota esta incompleto o pendiente,
   */
  isLife: boolean;

  /**fecha de corte de la cuota**/
  dueDate: string;

  /**fecha de cobro efectiva de la cuota */
  paymentDate: string

  /**fecha de creacion de cuota */
  createdAt: string;

  /**fecha en la que se completo el pago total de la cuota */
  paidAt?: string;

  /**registro de pagos, es la lista de id de payments */
  payments?: string[];

  //fechas de pagos

  /**fecha en la que se completo el pago de capital*/
  capitalPaidAt?: string;

  /**fecha en la que se completo el pago de interes*/
  interestPaidAt?: string;

  /**fecha en la que se completo el pago del monto (capital + interes)*/
  amountPaidAt?: string;

  /**fecha en la que se completo el pago de mora*/
  arrearsPaidAt?: string;

  /**fecha en la que se completo el pago de aplazamiento */
  deferredPaidAt?: string;

  /**fecha en la que se completo el pago total de la cuota */
  totalPaidAt?: string;

  /**dias en los que se pago el capital */
  daysOfCapital: number

  /**dias de mora reales del cliente */
  daysOfArrears?: number;

  /**dias de aplazamiento reales del cliente(difiere del dia de aplazamiento ya que se quiere saber cuantos dias realmente se pago desde la fecha de corte orifinal, se calcula aqui para filtrados posteriores por dias de mora) */
  daysOfDeferment?: number;

  /**daysOfArrears+daysOfDeferment */
  totalDaysOfArrears?: number;

  //montos registrador por el cobrador y que no han sido validados por el contador

  /** capital pendiente por confirmar de parte del contador*/
  pendinCapital: number

  /**interes pendiente por confirmar de parte del contador */
  pendeningInterest: number

  /**monto pendiente por confirmar de parte del contador */
  pendingAmount: number

  /**interes pendiente por confirma de parte del contador */
  pendingArrears: number

  /**aplazamiento pendiente por confirmar de parte del contador */
  pendingDeferment: number

  /**total pendiente por confirmar de parte del contador */
  pendingTotal: number

  /**saldo pendiente por cobrar, este saldo indica en total en base a las configuraciones del credito y en base a los montos pagados y pendientes por validar cuanto quedaria por cobrar en la cuota */
  outstandingReceivables: number

  /**monto(capital+interes) pendiente por cobrar */
  outstandingReceivablesAmount: number

  /**interes por aplazamiento pendiente por cobrar */
  outstandingReceivablesDeferment: number

  /**mora pendiente por cobrar */
  outstandingReceivablesArrears: number

  // --- GESTIÓN DE COBRO EN CAMPO ---
  /** indica si la cuota fue aplazada */
  deferred: boolean;

  /** indica si el cobrador ya gestionó la cuota hoy */
  managed: boolean;

  /**fecha en la que se cerro la deuda(pagada/renovada)*/
  closedAt?: string;

  /** fecha en la que se marcó como gestionada */
  managementDate?: string;

  /** indica si se intentó cobrar la cuota */
  attemptedCollection: boolean;

  /** fecha del último intento de cobro */
  dateAttemptedPayment?: string;

  /** descripción del último intento de cobro */
  descriptionAttemptedPayment?: string;

  /** ubicación del último intento de cobro */
  locationAttemptedPayment?: LocationGPS;

  // --- OBSERVACIONES Y NOTAS ---
  //las observaciones hechas por un mismo usuario no crear observaciones nuevas
  //limitar las observaciones a 5 por entidad

  /**observaciones del cobrador*/
  collectorNotes?: string;

  /**observaciones del auditor*/
  AuditorNotes?: string;

  /**observaciones del contador*/
  accountantNotes?: string;


}

/**
 * ubicacion del cliente
 */
export const defaultInstallmentAddress: Address = {
  address: "",
  neighborhood: "",
  stratum: 0,
  city: "",
  locationGPS: {
    coordinates: "",
    latitude: 0,
    longitude: 0,
  },

};

/**
 * genera un installmnet con valores por defecto
 * @returns un installment con valores por defecto
 */
export function defaultInstallment(): Installment {
  return {
    defermentPaid: 0,
    pendingDeferment: 0,
    remainingDefermentToPay: 0,
    percentageOfDefermentPaid: 0,
    daysOfCapital: 0,
    requiredArrears: "no",
    requiredState: false,
    outstandingReceivablesAmount: 0,
    outstandingReceivablesDeferment: 0,
    routeName: "",
    outstandingReceivablesArrears: 0,
    pendeningInterest: 0,
    pendinCapital: 0,
    pendingAmount: 0,
    pendingArrears: 0,
    outstandingReceivables: 0,
    pendingTotal: 0,
    id: "",
    debtId: "",
    amount: 0,
    type: "fijo",
    amountPaid: 0,
    interest: 0,
    totalPaid: 0,
    total: 0,
    attemptedCollection: false,
    managed: false,
    numberOfArrearsDays: 0,
    percentageOfInterestPaid: 0, // Corregido de 100 a 0
    percentageOfAmountPaid: 0,   // Corregido de 100 a 0
    percentageOfTotalPaid: 0,    // Corregido de 100 a 0
    percentageOfCapitalPaid: 0,  // Corregido de 100 a 0
    porcentageOfArrearsPaid: 0,  // Corregido de 100 a 0
    remainingAmountToPay: 0,
    remainingArrearsToPay: 0,
    remainingCapitalToPay: 0,
    remainingInterestToPay: 0,
    remainingTotalToPay: 0,
    interestPaid: 0,
    capitalPaid: 0,
    capital: 0,
    defermentDays: 0,
    deferment: 0,
    companyId: "",
    interestRate: 0,
    arrearsInterestRate: 0,
    routeId: "",
    clientId: "",
    clientDocument: "",
    clientName: "defaultInstallment",
    clientNumber: "",
    clientAddres: defaultInstallmentAddress,
    installmentTotalNumber: 0,
    installmentNumber: 0,
    arrears: 0,
    dueDate: "",
    paymentDate: "",
    status: "pendiente",
    isLife: false,
    createdAt: "",
    payments: [],
    arrearsPaid: 0,
    deferred: false,
  }
}


export interface DeferInstallmentParams {
  installment: Installment;
  newDueDate: string;
  newInterestRate: number;
  defermentAmount: number;
  defermentDays: number;
}

/**
 * 
 * @param param0 al marcar un valor de aplazamieno por cueta de una cuota no se le suma el valo de mora aplazada sino que se cambia por el calculo actual de mora aplazada
 * @returns 
 */
export function deferInstallment({
  installment,
  newDueDate,
  newInterestRate,
  defermentAmount,
  defermentDays,
}: DeferInstallmentParams): Installment {
  const invalidFields = [];
  console.log("defermentAmount", defermentAmount);
  console.log("defermentDays", defermentDays);
  console.log("installment", installment);
  console.log("newDueDate", newDueDate);
  console.log("newInterestRate", newInterestRate);


  if (!Number.isFinite(defermentAmount) || defermentAmount < 0) {
    invalidFields.push(`defermentAmount invalid (value: ${defermentAmount}, type: ${typeof defermentAmount})`);
  }

  if (!Number.isFinite(defermentDays) || defermentDays < 0) {
    invalidFields.push(`defermentDays invalid (value: ${defermentDays}, type: ${typeof defermentDays})`);
  }

  if (invalidFields.length > 0) {
    throw new Error(`Los valores del aplazamiento no son válidos: ${invalidFields.join('; ')}`);
  }

  // Se reemplaza el cargo anterior.
  const deferment = defermentAmount;

  const total =
    installment.amount +
    installment.arrears +
    deferment;

  const remainingTotalToPay = Math.max(
    0,
    total -
    installment.totalPaid -
    installment.pendingTotal,
  );
  const remainingDefermentToPay = Math.max(
    0,
    deferment -
    installment.defermentPaid -
    installment.pendingDeferment,
  );

  return {
    ...installment,

    defermentDueDate: newDueDate,
    arrearsInterestRate: newInterestRate,
    defermentDays: defermentDays,
    deferred: true,

    deferment,
    total,

    remainingDefermentToPay,
    remainingTotalToPay,

    percentageOfDefermentPaid:
      deferment > 0
        ? Math.min(
          100,
          (installment.defermentPaid / deferment) * 100,
        )
        : 100,

    percentageOfTotalPaid:
      total > 0
        ? Math.min(
          100,
          (installment.totalPaid / total) * 100,
        )
        : 100,

    outstandingReceivablesDeferment:
      remainingDefermentToPay,

    outstandingReceivables:
      remainingTotalToPay,
  };
}