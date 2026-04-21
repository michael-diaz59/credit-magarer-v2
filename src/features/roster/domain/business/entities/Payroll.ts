
export type PayrollPaymentMethod = "efectivo" | "consignacion";

export type PayrollPaymentStatus = "registrado" | "conflicto" | "confirmado" | "cancelada";

export interface Payroll {
    id: string;
    userId: string;
    companyId: string;
    amount: number;
    method: PayrollPaymentMethod;
    status: PayrollPaymentStatus;
    idProof: string; // Filename of the proof in storage
    bankAccountId?: string;
    createdAt: string; // YYYY-MM-DD (mapped from Timestamp in DB)
}
