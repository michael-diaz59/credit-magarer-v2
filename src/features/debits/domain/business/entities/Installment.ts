import type { LocationGPS } from "../../../../costumers/domain/business/entities/Address";


/**
 * el estado de una cuota: \
 * pendiente: la cuota no se ha pagado  \
 * pagada: el cobrador registro la cuota como pagada  \
 * incompleto: el conbrador recibio un pago parcial de la deuda  \
 * cancelada: la deuda se cancelo \
 * liquidada: el contador avalo todos los pagos que completan el total de la cuota\
*/
export type InstallmentStatus =
  | 'pendiente'
  | 'renovada'
  | 'pagada'
  | 'incompleto'
  | 'liquidada'
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

  /**tasa de interes para retraso*/
  arrearsInterestRate: number;

  // --- VALORES BASE DE LA CUOTA ---
  /**capital generado por la cuota */
  capital: number;

  /**interes generado por la cuota */
  interest: number;

  /**valor de la cuota generado (capital + interes)*/
  amount: number;

  /**mora generada por la cuota */
  arrears: number;

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

  /**fecha de pago de con retraso*/
  arrearsDueDate?: string;

  // --- ESTADO, FECHAS Y PAGOS ---
  /**estado de la cuota:  "pendiente" | "pagada" | "en_mora" | "conflicto" | "cancelada"*/
  status: InstallmentStatus;

  /**fecha de corte de la cuota**/
  dueDate: string;

  /**fecha de creacion de cuota */
  createdAt: string;

  /**fecha en la que se completo el pago de la cuota */
  paidAt?: string;

  /**registro de pagos, es la lista de id de payments */
  payments?: string[];

  // --- GESTIÓN DE COBRO EN CAMPO ---
  /** indica si la cuota fue aplazada */
  deferred: boolean;

  /** indica si el cobrador ya gestionó la cuota hoy */
  managed: boolean;

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
    id: "",
    debtId: "",
    amount: 0,
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
    createdAt: "",
    payments: [],
    arrearsPaid: 0,
    deferred: false,
  }
}