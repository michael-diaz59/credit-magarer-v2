import { fail, ok, type Result } from "../../../../core/helpers/ResultC";
import { FirebaseDebtRepository } from "../../provider/firebase/DebtRepository";
import { FirebaseInstallmentRepository } from "../../provider/firebase/FirebaseInstallmentRepository";
import { FirebaseCostumerRepository } from "../../../costumers/repository/FirebaseCostumerRepository";
import { CreateDebtUseCase, type CreateDebtError, type CreateDebtUInput, type CreateDebtUOutput } from "../business/useCases/debt/CreateDebtUseCase";
import { GetByFiltersCase, type GetByFiltersError, type GetByFiltersInput, type GetByFiltersOutput } from "../business/useCases/debt/GetByFiltersCase";
import { GetDebitByIdCase, type GetDebitByIdInput, type GetDebitByIdOutput } from "../business/useCases/debt/GetDebitByIdCase";
import { GetDebstByCostumerDocumentCase, type GetDebstByCostumerDocumentInput, type GetDebstByCostumerDocumentOutput } from "../business/useCases/debt/GetDebstByCostumerDocumentCase";
import { GetDebtsCase, type GetDebtsInput, type GetDebtsOutput } from "../business/useCases/debt/GetDebtsCase";
import { SimulateDebtCase, type SimulateDebtError, type SimulateDebtInput, type SimulateDebtOutput } from "../business/useCases/debt/SimulateDebtCase";
import { UpdateDebtUseCase, type UpdateDebitInput, type UpdateDebitOutput } from "../business/useCases/debt/UpdateDebtUseCase";
import { UpdateDebtStatusUseCase, type UpdateDebtStatusInput, type UpdateDebtStatusOutput, type UpdateDebtStatusError } from "../business/useCases/debt/UpdateDebtStatusUseCase";
import { GetInstallmentsByDebtCase, type GetInstallmentsByDebtInput, type GetInstallmentsByDebtOutput } from "../business/useCases/installment/GetInstallmentsByDebtCase";
import { UpdateInstallmentByDebtCase, type UpdateInstallmentByDebtInput, type UpdateInstallmentByDebtOutput } from "../business/useCases/installment/UpdateInstallmentsByDebtCase";
import { GetDebtsValidByCollectorUseCase, type GetDebtsValidByCollectorInput, type GetDebtsValidByCollectorOutput } from "../business/useCases/debt/GetDebtsValidByCollectorUseCase";
import { GetDebtsByRouteUseCase, type GetDebtsByRouteInput, type GetDebtsByRouteOutput } from "../business/useCases/debt/GetDebtsByRouteUseCase";
import { GetTotalDeliveredCapitalUseCase, type GetTotalDeliveredCapitalInput, type GetTotalDeliveredCapitalOutput, type GetTotalDeliveredCapitalError } from "../business/useCases/debt/GetTotalDeliveredCapitalUseCase";
import { GetSumRenewalPaymentUseCase, type GetSumRenewalPaymentInput, type GetSumRenewalPaymentOutput, type GetSumRenewalPaymentError } from "../business/useCases/debt/GetSumRenewalPaymentUseCase";
import { ConfirmDebtDeliveryUseCase, type ConfirmDebtDeliveryInput } from "../business/useCases/debt/ConfirmDebtDeliveryUseCase";
import { CreateDebtFromExcelCase, type CreateDebtFromExcelInput } from "../business/useCases/debt/createDebtFromExcel";
import type { DebtGateway, InstallmentGateway } from "./DebtGatweay";
import { SimulateDebtVariableCase } from "../business/useCases/debt/SimulateDebtVariableCase";

export default class DebtOrchestrator {

    private createDebtCase: CreateDebtUseCase
    private getDebtsCase: GetDebtsCase
    private getByFiltersCase: GetByFiltersCase
    private getDebitByIdCase: GetDebitByIdCase
    private getDebstByCostumerDocumentCase: GetDebstByCostumerDocumentCase
    private updateDebtUseCase: UpdateDebtUseCase
    private updateDebtStatusUseCase: UpdateDebtStatusUseCase
    private debtGateway: DebtGateway
    private simulateDebtCase: SimulateDebtCase
    private simulateDebtVariableCase: SimulateDebtVariableCase
    private getDebtsValidByCollectorUseCase: GetDebtsValidByCollectorUseCase
    private getDebtsByRouteUseCase: GetDebtsByRouteUseCase
    private getTotalDeliveredCapitalUseCase: GetTotalDeliveredCapitalUseCase
    private getSumRenewalPaymentUseCase: GetSumRenewalPaymentUseCase
    private confirmDebtDeliveryUseCase: ConfirmDebtDeliveryUseCase
    private createDebtFromExcelCase: CreateDebtFromExcelCase

    private getInstallmentsByDebtCase: GetInstallmentsByDebtCase
    private updateInstallmentByDebtCase: UpdateInstallmentByDebtCase
    private installmentGateway: InstallmentGateway


    constructor() {
        this.debtGateway = new FirebaseDebtRepository()

        this.simulateDebtCase = new SimulateDebtCase()
        this.simulateDebtVariableCase = new SimulateDebtVariableCase()
        this.installmentGateway = new FirebaseInstallmentRepository()
        const costumerGateway = new FirebaseCostumerRepository()
        this.createDebtCase = new CreateDebtUseCase(this.debtGateway, costumerGateway, this.installmentGateway)
        this.getDebitByIdCase = new GetDebitByIdCase(this.debtGateway)
        this.getByFiltersCase = new GetByFiltersCase(this.debtGateway)
        this.getDebtsCase = new GetDebtsCase(this.debtGateway)
        this.getDebstByCostumerDocumentCase = new GetDebstByCostumerDocumentCase(this.debtGateway)
        this.updateDebtUseCase = new UpdateDebtUseCase(this.debtGateway, this.installmentGateway, costumerGateway)
        this.updateDebtStatusUseCase = new UpdateDebtStatusUseCase(this.debtGateway)
        this.getInstallmentsByDebtCase = new GetInstallmentsByDebtCase(this.installmentGateway)
        this.updateInstallmentByDebtCase = new UpdateInstallmentByDebtCase(this.installmentGateway)
        this.getDebtsValidByCollectorUseCase = new GetDebtsValidByCollectorUseCase(this.debtGateway)
        this.getDebtsByRouteUseCase = new GetDebtsByRouteUseCase(this.debtGateway)
        this.getTotalDeliveredCapitalUseCase = new GetTotalDeliveredCapitalUseCase(this.debtGateway)
        this.getSumRenewalPaymentUseCase = new GetSumRenewalPaymentUseCase(this.debtGateway)
        this.confirmDebtDeliveryUseCase = new ConfirmDebtDeliveryUseCase(this.debtGateway)
        this.createDebtFromExcelCase = new CreateDebtFromExcelCase(this.debtGateway)
    }

    async getDebts(input: GetDebtsInput): Promise<GetDebtsOutput> {
        return this.getDebtsCase.execute(input)
    }

    async getByFilters(input: GetByFiltersInput): Promise<Result<GetByFiltersOutput, GetByFiltersError>> {
        return this.getByFiltersCase.execute(input)
    }

    async getDebtsForCustomer(input: GetDebtsInput): Promise<GetDebtsOutput> {
        return this.getDebtsCase.execute(input)
    }

    async simulateDebt(input: SimulateDebtInput): Promise<Result<SimulateDebtOutput, SimulateDebtError>> {
        switch (input.debt.type) {
            case "fijo":
                return this.simulateDebtCase.execute(input);

            case "variable": {
                const result = await this.simulateDebtVariableCase.execute(input);
                if (!result.ok) {
                    if (result.error.code === "CAPITAL_MINIMO_1000") {
                        return fail({ code: "el capital debe ser mayor a 1000" });
                    }
                    return fail({ code: "STATE_INVALID" });
                }

                const mappedOutput: SimulateDebtOutput = {
                    valueOfInstallments: result.value.valueOfInstallments,
                    totalAmount: input.debt.capital,
                    capital: input.debt.capital,
                    totalInstallments: result.value.installments.length,
                    cuotasCompletas: 0,
                    pago_ultima_cuota: result.value.valueOfInstallments,
                    pago_cuota_reound: result.value.valueOfInstallments,
                    installments: result.value.installments,
                };
                console.log(mappedOutput)

                return ok(mappedOutput);
            }

            default:
                return this.simulateDebtCase.execute(input);
        }
    }



    async createDebt(input: CreateDebtUInput): Promise<Result<CreateDebtUOutput, CreateDebtError>> {
        return this.createDebtCase.execute(input)
    }

    async createDebtFromExcel(input: CreateDebtFromExcelInput): Promise<Result<void, CreateDebtError>> {
        return this.createDebtFromExcelCase.execute(input)
    }

    async getDebitById(input: GetDebitByIdInput): Promise<GetDebitByIdOutput> {
        return this.getDebitByIdCase.execute(input)
    }
    async getDebstByCostumerDocument(input: GetDebstByCostumerDocumentInput): Promise<GetDebstByCostumerDocumentOutput> {
        return this.getDebstByCostumerDocumentCase.execute(input)
    }

    async updateDebtUse(input: UpdateDebitInput): Promise<UpdateDebitOutput> {
        return this.updateDebtUseCase.execute(input)
    }

    async updateDebtStatus(input: UpdateDebtStatusInput): Promise<Result<UpdateDebtStatusOutput, UpdateDebtStatusError>> {
        return this.updateDebtStatusUseCase.execute(input)
    }


    async getInstallmentsByDebt(input: GetInstallmentsByDebtInput): Promise<GetInstallmentsByDebtOutput> {
        return this.getInstallmentsByDebtCase.execute(input)
    }

    async updateInstallmentByDebt(input: UpdateInstallmentByDebtInput): Promise<UpdateInstallmentByDebtOutput> {
        return this.updateInstallmentByDebtCase.execute(input)
    }

    async getDebtsValidByCollector(input: GetDebtsValidByCollectorInput): Promise<Result<GetDebtsValidByCollectorOutput, any>> {
        return this.getDebtsValidByCollectorUseCase.execute(input)
    }

    async getDebtsByRoute(input: GetDebtsByRouteInput): GetDebtsByRouteOutput {
        return this.getDebtsByRouteUseCase.execute(input)
    }

    async getTotalDeliveredCapital(input: GetTotalDeliveredCapitalInput): Promise<Result<GetTotalDeliveredCapitalOutput, GetTotalDeliveredCapitalError>> {
        return this.getTotalDeliveredCapitalUseCase.execute(input);
    }

    async getSumRenewalPayment(input: GetSumRenewalPaymentInput): Promise<Result<GetSumRenewalPaymentOutput, GetSumRenewalPaymentError>> {
        return this.getSumRenewalPaymentUseCase.execute(input);
    }

    async confirmDebtDelivery(input: ConfirmDebtDeliveryInput): Promise<Result<null, any>> {
        return this.confirmDebtDeliveryUseCase.execute(input);
    }
}