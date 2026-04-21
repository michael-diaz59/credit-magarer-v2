import type { PaymentMethod, PaymentStatus } from "../../../../debits/domain/business/entities/Payment";

export type CategoryPayment =
  | 'other'
  | 'pagos a inversores'
  | 'descuadre';

export interface AnotherPayment {
  id: string;
  createdAt: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  bankAccountId: string;
  idProofOfPayment: string;
  observations: string;
  userId: string;
  category: CategoryPayment;
}
