


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

/**representa la cuota a pagar, este se usa en el modulo de cobrador para ver las rutas */
export interface Installment {

  id: string;

  //id de la deuda
  debtId: string;

  /**tasa original de interes*/
  originalInterestRate: number;

  /**tasa de interes*/
  interestRate: number;

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

  /**monto a pagar en la cuota, se puede manjear con monto pagado para seleccionar pagos incompletos */
  amount: number;

  /**monto pagado */
  paidAmount?: number;

  /**fecha de pago de cuota */
  dueDate: string;

  /**estado de la cuota:  "pendiente" | "pagada" | "en_mora" | "conflicto" | "cancelada"*/
  status: InstallmentStatus;

  /**fecha en la que se completo el pago de la cuota */
  paidAt?: string;

  /**fecha de creacion de cuota */
  createdAt: string;

  /**registro de pagos, es la lista de id de payments */
  payments? : string[]
}





