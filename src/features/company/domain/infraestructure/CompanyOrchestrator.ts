import type { CompanyGateway } from "./CompanyGateway";
import { RegisterCompanyIncomeUseCase, type CreateCompanyIncomeInput, type RegisterCompanyIncomeOutput, type RegisterCompanyIncomeError } from "../business/useCases/RegisterCompanyIncomeUseCase";
import { GetSumIncomesUseCase, type GetSumIncomesInput, type GetSumIncomesOutput, type GetSumIncomesError } from "../business/useCases/GetSumIncomesUseCase";
import { FirebaseCompanyRepository } from "../../provider/firebase/FirebaseCompanyRepository";
import type { Result } from "../../../../core/helpers/ResultC";
import { GetIncomesCase, type GetIncomesError, type GetIncomesInput, type GetIncomesOutput } from "../business/useCases/GetIncomesCase";

export default class CompanyOrchestrator {
    private registerIncomeUseCase: RegisterCompanyIncomeUseCase;
    private getSumIncomesUseCase: GetSumIncomesUseCase;
    private gateway: CompanyGateway;
    private getIncomesCase: GetIncomesCase;

    constructor() {
        this.gateway = new FirebaseCompanyRepository();
        this.registerIncomeUseCase = new RegisterCompanyIncomeUseCase(this.gateway);
        this.getSumIncomesUseCase = new GetSumIncomesUseCase(this.gateway);
        this.getIncomesCase = new GetIncomesCase(this.gateway);
    }


    async getIncomes(input: GetIncomesInput): Promise<Result<GetIncomesOutput, GetIncomesError>> {
        return this.getIncomesCase.execute(input);
    }
    async registerIncome(input: CreateCompanyIncomeInput): Promise<Result<RegisterCompanyIncomeOutput, RegisterCompanyIncomeError>> {
        return this.registerIncomeUseCase.execute(input);
    }

    async getSumIncomes(input: GetSumIncomesInput): Promise<Result<GetSumIncomesOutput, GetSumIncomesError>> {
        return this.getSumIncomesUseCase.execute(input);
    }

}
