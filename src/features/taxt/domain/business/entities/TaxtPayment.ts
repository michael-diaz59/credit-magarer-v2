import type { PaymentMethod, PaymentStatus } from "../../../../debits/domain/business/entities/Payment";

export interface TaxtPayment {
  id: string;
  createdAt: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  bankAccountId: string;
  idProofOfPayment: string;
  observations: string;
  userId: string;
}
