import type { LocationGPS } from "../../../../costumers/domain/business/entities/Address";
import type { requiredArrearsState } from "./core";
import type { DebtType } from "./Debt";


/**
 * el estado de una cuota: \
 * pendiente: la cuota no se ha pagado  \
 * pagada: la cuota se marco como pagada  \
 * incompleto: la cuota esta incompleta \
 * cancelada: la deuda se cancelo \
 * liquidada: la cuota se liquido por acuerdo con el cliente \
 * renovada: la cuota se renovo por acuerdo con el cliente \
*/
export type InstallmentStatus =
  | 'pendiente'
  | 'pagada'
  | 'incompleto'
  | 'liquidada'
  | 'renovada'
  | 'cancelada';

/**
 * representa la direccion de la casa del cliente, se mantiene sincronizado con costumer.address
 */
export interface InstallmentAddress {
  /**direccion */
  address: string;
  /**barrio */
  neighborhood: string;
  /**estrato */
  stratum: number;
  /**ciudad */
  city: string;
  /**ubicacion de la direccion */
  locationGPS?: LocationGPS
}


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
  clientAddres: InstallmentAddress;

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

  /**indica si la cuota sigue viva
   * false: cuando la cuota esta pagada, liquidada, cancelada, renovada
   * true: cuando la cuota esta incompleto o pendiente,
   */
  isLife: boolean;

  /**fecha de corte de la cuota**/
  dueDate: string;

  /**fecha de creacion de cuota */
  createdAt: string;

  /**fecha en la que se completo el pago de la cuota */
  paidAt?: string;

  /**registro de pagos, es la lista de id de payments */
  payments?: string[];

  //montos registrador por el cobrador y que no han sido validados por el contador

  /** capital pendiente por confirmar de parte del contador*/
  pendinCapital: number

  /**interes pendiente por confirmar de parte del contador */
  pendeningInterest: number

  /**monto pendiente por confirmar de parte del contador */
  pendingAmount: number

  /**interes pendiente por confirma de parte del contador */
  pendingArrears: number

  /**total pendiente por confirmar de parte del contador */
  pendingTotal: number

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
export const defaultInstallmentAddress: InstallmentAddress = {
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
    requiredArrears: "no",
    requiredState: false,
    pendeningInterest: 0,
    pendinCapital: 0,
    pendingAmount: 0,
    pendingArrears: 0,
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
    percentageOfInterestPaid: 100,
    percentageOfAmountPaid: 100,
    percentageOfTotalPaid: 100,
    percentageOfCapitalPaid: 100,
    porcentageOfArrearsPaid: 100,
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
    status: "pendiente",
    isLife: true,
    createdAt: "",
    payments: [],
    arrearsPaid: 0,
    deferred: false,
  }
}