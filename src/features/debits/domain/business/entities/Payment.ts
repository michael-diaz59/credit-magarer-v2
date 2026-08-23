import type { LocationGPS } from "../../../../costumers/domain/business/entities/Address";

/**los estados de un pago realizado: \
 * registrado: el cobrador registro un pago  \
 * conflicto: el contador indica que hay un problema con el pago  \
 * confirmado: el contador confirmo el pago  \
 * cancelada: el pago se cancelo  \
 */
export type PaymentStatus =
  | 'registrado'
  | 'conflicto'
  | 'confirmado'
  | 'cancelada';

/**los metodos de pago que existen: \
 * efectivo: pago en efectivo \
 * consignacion: pago realizado en una cuenta bancaria \
 */
export type PaymentMethod =
  | 'efectivo'
  | 'consignacion';


/**representa los pagos que hacen los clientes a los cobradores
 * los datos como intentos de cobro y tipos de pago se buscan a travez de filtros de payments y attemptCollection
*/
export interface Payment {
  // --- IDENTIFICACIÓN BASE Y RELACIONES ---
  /**id del pago */
  id: string;

  /** id del cliente */
  clientId: string;

  /**es el id de la deuda a la que pertenece el pago*/
  debtId: string;

  /**id de la cuota */
  installmentId: string;

  /**es el id a la ruta a la que pertenece el pago */
  idRoute: string;

  // --- INFORMACIÓN DE LOS ACTORES ---
  /**nombre del cliente */
  clientName: string;

  /**id del cobrador que realizo el pago*/
  collectorId: string;

  /**nombre del cobrador */
  collectorName: string;

  // --- DETALLES FINANCIEROS Y MONTOS ---
  /**monto del pago*/
  amount: number;

  /**monto pagado en capital*/
  capitalPaid: number;

  /**monto pagado en interes*/
  interestPaid: number;

  /**monto pagado en mora*/
  arrearsPaid: number;

  // --- TRANSACCIÓN Y MÉTODOS DE PAGO ---
  /**metodo de pago*/
  method: PaymentMethod;

  /**id de la cuenta de banco en la que se manda el pago*/
  bankAccountId?: string;

  //el comprobante se guarda en storage
  /**es el id al documento de comprobante de pago */
  idProofOfPayment: string;

  // --- ESTADO, TRAZABILIDAD Y CIERRE ---
  /**estado del pago*/
  status: PaymentStatus;

  /**fecha en la que se realizo el pago*/
  paidAt: string;

  /**ubicacion en la que se realizo el pago*/
  location?: LocationGPS;

  /**indica si el pago esta cuadrado*/
  isTight: boolean;

  // --- OBSERVACIONES ---
  /**observaciones del cobrador */
  collectorObservation: string;

  /**observaciones del contador */
  accountantObservation: string;
}

export function emptyPayment(): Payment {
  return {
    // --- IDENTIFICACIÓN BASE Y RELACIONES ---
    id: "",
    clientId: "",
    debtId: "",
    installmentId: "",
    idRoute: "",

    // --- INFORMACIÓN DE LOS ACTORES ---
    clientName: "",
    collectorId: "",
    collectorName: "",

    // --- DETALLES FINANCIEROS Y MONTOS ---
    amount: 0,
    capitalPaid: 0,
    interestPaid: 0,
    arrearsPaid: 0,

    // --- TRANSACCIÓN Y MÉTODOS DE PAGO ---
    method: "efectivo",
    bankAccountId: undefined,
    idProofOfPayment: "",

    // --- ESTADO, TRAZABILIDAD Y CIERRE ---
    status: "registrado",
    paidAt: "",
    location: undefined,
    isTight: false,

    // --- OBSERVACIONES ---
    collectorObservation: "",
    accountantObservation: "",
  };
}