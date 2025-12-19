import type { Timestamp } from "firebase/firestore";
import type { InstallmentStatus } from "../../domain/Installment";

export interface InstallmentFirebase {
  debtId: string;

  number: number;
  amount: number;

  dueDate: Timestamp;
  status: InstallmentStatus;

  paidAt?: Timestamp;
  delayDays?: number;
}