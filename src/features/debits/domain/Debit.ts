export type DebtType =
  | 'credito'
  | 'prestamo'
  | 'servicio'
  | 'otro';

export type DebtStatus =
  | 'activa'
  | 'pagada'
  | 'en_mora'
  | 'cancelada';

export interface DebtFormValues {
  type: DebtType;

  totalAmount: number;

  installmentCount: number;
  startDate: Date;

  // opcional
  firstDueDate?: Date;
}