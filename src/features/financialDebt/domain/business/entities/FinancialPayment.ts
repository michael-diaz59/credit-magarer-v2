import type { GeoLocation, PaymentMethod } from "../../../../debits/domain/business/entities/Payment";



export interface FinancialPayment {
    id: string;
    financialDebtId: string;
    amount: number;
    createAt: string; // ISO string
    method: PaymentMethod;
    collectorId: string; // User ID
    idProofOfPayment: string; // Storage URL or filename
    location?: GeoLocation;
    bankAccountId?: string;
    collectorName: string;
}
