export type InstallmentStatus =
  | 'pendiente'
  | 'pagada'
  | 'en_mora'
  | 'cancelada';


  /**representa la cuota a pagar, este se usa en el modulo de cobrador para ver las rutas */
export interface Installment {
  id: string;

  //id de la deuda
  debtId: string;

    //tasa de interes
  interestRate: number;

   //id del collector
  collectorId: string;

  //id del cliente
  costumerId: string;

  //cedula del cliente
  costumerDocument: string;

  //cedula del cliente
  costumerName: string;

  //direccion del cliente
  costumerAddres: InstallmentAddress;

  //numero de cueta que representa (1/4) (2/4) (3/4) (4/4)
  installmentNumber: number; // 1, 2, 3...

  //monto a pagar en la cuota, se puede manjear con monto pagado para seleccionar pagos incompletos
  amount: number;

  //fecha de pago de cuota
  dueDate: string;

  //estado de la cuota
  status: InstallmentStatus;

  //fecha en la que se registro la cuota como pagada
  paidAt?: string;

  //monto pagado
  paidAmount?: number;

  //fecha de creacion de cuota
  createdAt: string;
}

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