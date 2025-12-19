import type { Timestamp } from "firebase/firestore";

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'tarjeta'
  | 'otro';

export interface Payment {
  id: string;

  debtId: string;
  clientId: string;

  amount: number;
  paymentDate: Timestamp;

  method: PaymentMethod;

  appliedToInstallments: number[]; // ej: [1,2]
}
