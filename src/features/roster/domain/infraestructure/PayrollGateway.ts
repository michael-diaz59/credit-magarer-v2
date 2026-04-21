
import type { Result } from "../../../../core/helpers/ResultC";
import type { Payroll } from "../business/entities/Payroll";

export interface PayrollGateway {
    register(companyId: string, payroll: Payroll): Promise<Result<void, Error>>;
    getPaymentsByUserId(companyId: string, userId: string): Promise<Result<Payroll[], Error>>;
    getPaymentById(companyId: string, paymentId: string): Promise<Result<Payroll | null, Error>>;
    uploadProof(companyId: string, payrollId: string, file: File): Promise<Result<string, Error>>;
    generateId(companyId: string): string;
}
