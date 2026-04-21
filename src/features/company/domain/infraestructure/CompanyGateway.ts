import type { Result } from "../../../../core/helpers/ResultC";
import type { GetIncomesError, GetIncomesInput, GetIncomesOutput } from "../business/useCases/GetIncomesCase";
import type { CreateCompanyIncomeInput } from "../business/useCases/RegisterCompanyIncomeUseCase";


export interface CompanyGateway {
    createIncome(input: CreateCompanyIncomeInput): Promise<Result<null, any>>;
    createIncomeAndUpdateAccount(input: CreateCompanyIncomeInput): Promise<Result<string, any>>;
    getIncomes(companyId: GetIncomesInput): Promise<Result<GetIncomesOutput, GetIncomesError>>;
    uploadIncomeProof(companyId: string, incomeId: string, file: File): Promise<Result<string, any>>;
    updateIncomeProof(companyId: string, incomeId: string, fileName: string): Promise<Result<null, any>>;
    getSumIncomes(companyId: string): Promise<Result<number, any>>;
}
