
import type { Result } from "../../../../core/helpers/ResultC";
import type { FinancialDebt } from "../business/entities/FinancialDebt";

export default interface FinancialDebtGateway {
    create(companyId: string, financialDebt: FinancialDebt): Promise<Result<void, Error>>;
    update(companyId: string, financialDebt: FinancialDebt): Promise<Result<void, Error>>;
    getAll(companyId: string): Promise<Result<FinancialDebt[], Error>>;
    getById(companyId: string, id: string): Promise<Result<FinancialDebt | null, Error>>;
    uploadProof(companyId: string, financialDebtId: string, file: File): Promise<Result<string, Error>>;
    generateId(companyId: string): string;
}
