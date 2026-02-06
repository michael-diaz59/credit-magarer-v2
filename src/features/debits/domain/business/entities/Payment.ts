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
  ;



export type PaymentMethod =
  | 'efectivo'
  | 'consignacion'

  
/**representa los pagos que hacen los clientes a los cobradores*/
export interface Payment {
    //el comprobante se guarda en storage
  /**es el id al documento de comprobante de pago */
  idProofOfPayment: string
  id: string;

    /**observaciones del cobrador */
  collectorObservation: string

  /**observaciones del contador */
  accountantObservation: string

  /**id de la cuota */
  installmentId: string;
  /**nombre del cliente */
  costumerName: string;
  /**nombre del cliente */
  collectorName: string;

  collectorId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string;
  location?: GeoLocation;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;   // metros
  provider?: "gps" | "network";
}