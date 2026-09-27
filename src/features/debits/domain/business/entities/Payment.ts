import type { LocationGPS } from "../../../../costumers/domain/business/entities/Address";
/**los estados de un pago realizado: \
 * registrado: el cobrador registro un pago  \
 * conflictoCobrador: el contador indica que hay un problema con el pago  \
 * conflictoCliente:el contador indica que hay un problema con el pago por deposito del cliente
 * confirmado: el contador confirmo el pago  \
 * cancelada: el pago se cancelo  \
 */
export type PaymentStatus =
  | 'registrado'
  | 'conflictoCobrador'
  | 'conflictoCliente'
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

  /**id del contador que actualiza el pago */
  accountantId?: string;

  /**es el id de la deuda a la que pertenece el pago*/
  debtId: string;

  /**id de la cuota */
  installmentId: string;

  /**es el id a la ruta a la que pertenece el pago */
  idRoute: string;

  // --- INFORMACIÓN DE LOS ACTORES ---
  /**nombre del cliente */
  clientName: string;

  /**id del cobrador que registro el pago*/
  collectorId: string;

  /**nombre del cobrador */
  collectorName: string;

  // --- DETALLES FINANCIEROS Y MONTOS ---
  /**monto del pago(total del pago)*/
  amount: number;

  /**monto pagado en capital*/
  capitalPaid: number;

  /**monto pagado en interes*/
  interestPaid: number;

  /**monto pagado en mora*/
  arrearsPaid: number;

  /**monto pagado por concepto de aplazamiento*/
  defermentPaid: number;

  // --- TRANSACCIÓN Y MÉTODOS DE PAGO ---
  /**metodo de pago*/
  method: PaymentMethod;

  /**id de la cuenta de banco en la que se manda el pago*/
  bankAccountId?: string;

  //el comprobante se guarda en storage
  /**es el id al documento de comprobante de pago */
  idProofOfPayment?: string;

  // --- ESTADO, TRAZABILIDAD Y CIERRE ---
  /**estado del pago*/
  status: PaymentStatus;

  /**fecha en la que se realizo el pago*/
  paidAt: string;

  /**ubicacion en la que se realizo el pago*/
  location?: LocationGPS;

  /**indica si el pago esta cuadrado*/
  isTight: boolean;

  /**indica la fecha en la que el pago fue cuadrado*/
  tightDate?: string;

  // --- OBSERVACIONES ---
  /**observaciones del cobrador */
  collectorObservation?: string;

  /**observaciones del contador */
  accountantObservation?: string;
}

export function emptyPayment(): Payment {
  return {
    // --- IDENTIFICACIÓN BASE Y RELACIONES ---
    id: "",

    debtId: "",
    installmentId: "",
    idRoute: "",

    // --- INFORMACIÓN DE LOS ACTORES ---
    clientName: "",
    clientId: "",
    collectorId: "",
    collectorName: "",

    // --- DETALLES FINANCIEROS Y MONTOS ---
    amount: 0,
    capitalPaid: 0,
    interestPaid: 0,
    arrearsPaid: 0,
    defermentPaid: 0,

    // --- TRANSACCIÓN Y MÉTODOS DE PAGO ---
    method: "efectivo",

    // --- ESTADO, TRAZABILIDAD Y CIERRE ---
    status: "registrado",
    paidAt: "",
    isTight: false,
  };
}