import type { Address } from "../../../../costumers/domain/business/entities/Address";

export type CollectorPaymentStatus =
  | "pendiente"
  | "entregado"
  | "cancelado";

/**representa un pago que debe realizar dar a un cliente para empezar un credito */
export interface CollectorPayment {

  id: string
  /**id del cobrador */
  collectorId: string;

  /**nombre del cobrador*/
  collectorName: string;

  /**notas del cobrador*/
  collectorNotes: string;

  /**id del cliente */
  clientId: string;

  /**nombre del cliente*/
  clientName: string;

  /**documento del cliente*/
  clientDocument: string;

  /**telefono del cliente*/
  clientPhone: string;

  /**direccion del cliente */
  clientAddres: Address;

  /**monto del pago a realizar a un cliente */
  amount: number;

  /**monto del pago realizado a un cliente */
  amountPaid: number;

  /**saldo pendiente de entregar al cliente*/
  amountPending: number;

  /**porcentaje del pago realizado */
  percentageOfAmountPaid: number;

  /**estado del pago*/
  status: CollectorPaymentStatus;

  /**si es true indica que el pago se debe entregar al cliente */
  ToPay: boolean

  /**fecha de registro de pago desde contabilidad*/
  registresDate: string;

  /**fecha limite para realizar el pago*/
  dateToPay: string;

  /**fecha en la que se realizo el pago*/
  paymentDate?: string;

  /**ruta a la que pertenece el pago*/
  routeId: string;

  /**nombre de la ruta*/
  routeName: string;

  /**id de la cuota */
  debtId: string;

  /**id del contador asignado*/
  accountantId: string;

  /**nombre del contador asignado*/
  accountantNotes: string;
}