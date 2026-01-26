

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta'
  | 'otro';

export interface Payment {
  id: string;
  //validacion de contador, solo el contador puede validar los pagos
  validatAaccountant: boolean

  //id cuota
  installmentId: string;

  //id cobrador
  collectorId: string;

  //id del cliente
  costumerId: string;

  amount: number;
  paymentDate: string;

  method: PaymentMethod;

  appliedToInstallments: number[]; // ej: [1,2]
}
