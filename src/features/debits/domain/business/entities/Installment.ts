


/**
 * el estado de una cuota:
 * pendiente: la cuota no se ha pagado |
 * pagada: el cobrador registro la cuota como pagada |
 * incompleto: el conbrador recibio un pago parcial de la deuda |
 * cancelada: la deuda se cancelo
 * liquidada: el contador avalo todos los pagos que completan el total de la cuota
*/
export type InstallmentStatus =
  | 'pendiente'
  | 'renovada'
  | 'pagada'
  | 'incompleto'
  | 'liquidada'
  | 'cancelada';


//mantener sincronizado con costumer.address
export interface InstallmentAddress {
  //direccion
  address: string;

  //barrio
  neighborhood: string;
  //estrato
  stratum: number;
  //ciudad
  city: string;
}

export function cloneInstallment(original: Installment): Installment {
  return structuredClone(original);
}

import type { GeoLocation } from "./Payment";

/**representa la cuota a pagar, este se usa en el modulo de cobrador para ver las rutas */
export interface Installment {

  id: string;

  //id de la deuda
  debtId: string;

  /**id de la comañia usada para las reglas de seguridad de grupos */
  companyId: string

  /**tasa de interes*/
  interestRate: number;

  /**tasa de interes para retraso*/
  lateInterestRate: number

  /**id del collector */
  collectorId: string;

  /**id del cliente*/
  costumerId: string;

  /** cedula del cliente */
  costumerDocument: string;

  /**nombre del cliente */
  costumerName: string;

  /**celular del cliente */
  costumerNumber: string;

  /**direccion del cliente */
  costumerAddres: InstallmentAddress;

  /**total de cuotas de la deuda */
  installmentTotalNumber: number; // 6

  /**numero de cuota en la deuda */
  installmentNumber: number; // 1, 2, 3...

  /**valor de la cuota*/
  amount: number;

  /**monto pagado de la cuota */
  paidAmount: number;

  /**dinero extra que se debe pagar por atraso en el pago */
  latepayment: number;

  /**fecha de pago de la cuota*/
  dueDate: string;

  /**fecha de pago de con retraso*/
  lateDueDate: string;

  /**estado de la cuota:  "pendiente" | "pagada" | "en_mora" | "conflicto" | "cancelada"*/
  status: InstallmentStatus;

  /**fecha en la que se completo el pago de la cuota */
  paidAt?: string;

  /**fecha de creacion de cuota */
  createdAt: string;

  /**registro de pagos, es la lista de id de payments */
  payments?: string[]

  /**dinero total pagado por interes de mora de esta cuota */
  paidLatePayment: number;

  /** indica si la cuota fue aplazada */
  aplazado?: boolean;

  /** indica si el cobrador ya gestionó la cuota hoy */
  managed?: boolean;

  /** fecha en la que se marcó como gestionada */
  managementDate?: string;

  /** indica si se intentó cobrar la cuota */
  attemptedCollection?: boolean;

  /** fecha del último intento de cobro */
  dateAttemptedPayment?: string;

  /** descripción del último intento de cobro */
  descriptionAttemptedPayment?: string;

  /** ubicación del último intento de cobro */
  locationAttemptedPayment?: GeoLocation;
}





