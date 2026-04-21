
import type { Result } from "../../../../core/helpers/ResultC";
import type { FinancialPayment } from "../business/entities/FinancialPayment";

export default interface FinancialPaymentGateway {
    registerPayment(companyId: string, payment: FinancialPayment): Promise<Result<void, Error>>;
    getPaymentsByDebtId(companyId: string, debtId: string): Promise<Result<FinancialPayment[], Error>>;
    getPaymentById(companyId: string, paymentId: string): Promise<Result<FinancialPayment | null, Error>>;
    uploadProof(companyId: string, paymentId: string, file: File): Promise<Result<string, Error>>;
    generateId(companyId: string): string;
}
