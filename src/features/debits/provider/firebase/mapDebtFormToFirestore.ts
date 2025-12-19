import { Timestamp } from 'firebase/firestore';
import type { DebtFormValues } from '../../domain/DebtFormValues';
import type { DebitFirebase } from './debitFirebase';

export function mapDebtFormToFirestore(
  form: DebtFormValues,
  companyId: string,
  clientId: string
): DebitFirebase {
  return {
    companyId,
    clientId,

    type: form.type,
    status: 'activa',

    totalAmount: form.totalAmount,

    installmentCount: form.installmentCount,
    paidInstallments: 0,
    pendingInstallments: form.installmentCount,

    hasDelay: false,

    startDate: Timestamp.fromDate(form.startDate),
    createdAt: Timestamp.now(),
  };
}
