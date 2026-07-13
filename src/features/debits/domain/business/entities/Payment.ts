/**los estados de un pago realizado:
 * registrado: el cobrador registro un pago |
 * conflicto: el contador indica que hay un problema con el pago |
 * confirmado: el contador confirmo el pago |
 * cancelada: el pago se cancelo
 */
export type PaymentStatus =
  | 'registrado'
  | 'conflicto'
  | 'confirmado'
  | 'cancelada';

export type PaymentMethod =
  | 'efectivo'
  | 'consignacion';


/**representa los pagos que hacen los clientes a los cobradores*/
export interface Payment {
  //el comprobante se guarda en storage

  /**es el id a la deuda a la que pertenece el pago*/
  debtId: string;
  /**es el id al documento de comprobante de pago */
  idProofOfPayment: string

  id: string;

  /**es el id a la ruta a la que pertenece el pago */
  idRoute: string;

  /**indica si el pago esta cuadrado*/
  isTight: boolean;

  /**observaciones del cobrador */
  collectorObservation: string

  /**observaciones del contador */
  accountantObservation: string

  /**id de la cuota */
  installmentId: string;
  /**nombre del cliente */
  costumerName: string;
  /**nombre del cobrador */
  collectorName: string;

  collectorId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  location?: GeoLocation;
  bankAccountId?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;   // metros
  provider?: "gps" | "network";
}
