import { Timestamp } from 'firebase/firestore';
import type { DebtStatus, DebtType } from '../../domain/Debit';

export interface DebitFirebase {
  companyId: string;
  clientId: string;

  type: DebtType;
  status: DebtStatus;

  totalAmount: number;

  installmentCount: number;
  paidInstallments: number;
  pendingInstallments: number;

  hasDelay: boolean;

  startDate: Timestamp;
  endDate?: Timestamp;

  createdAt: Timestamp;
  lastPaymentDate?: Timestamp;
}
