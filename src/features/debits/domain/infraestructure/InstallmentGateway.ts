import type { Result } from "../../../../core/helpers/ResultC";
import type { CreateInstallmentsError, CreateInstallmentsGatewayInput, CreateInstallmentsOutput } from "../business/useCases/installment/CreateInstallmentsUseCase";
import type { UpdateByIdOutput, UpdateByIdError, UpdateByIdInput } from "../business/useCases/installment/UpdateByIdCase";
import type { Installment, InstallmentStatus } from "../business/entities/Installment";
import type { GetByCollectorError, GetByCollectorInput, GetByCollectorOutput } from "../business/useCases/installment/GetByCollectorCase";
import type { GetByIdError, GetByIdInput, GetByIdOutput } from "../business/useCases/installment/GetByIdCase";
import type { GetManagementInstallmentsInput } from "../business/useCases/installment/GetManagementInstallmentsUseCase";
import type { GetInstallmentsByDebtInput, GetInstallmentsByDebtOutput } from "../business/useCases/installment/GetInstallmentsByDebtCase";
import type { UpdateInstallmentByDebtInput, UpdateInstallmentByDebtOutput } from "../business/useCases/installment/UpdateInstallmentsByDebtCase";
import type { MarkInstallAsPaidError, MarkInstallAsPaidOutput } from "../business/useCases/installment/MarkInstallAsPaidCase";
import type { GetManagementInstallmentsByRoutesError, GetManagementInstallmentsByRoutesInput } from "../business/useCases/installment/GetManagementInstallmentsByRoutesUseCase";
import type { BalancesDueFromInstallmentError, BalancesDueFromInstallmentInput, BalancesDueFromInstallmentOutput } from "../business/useCases/installment/BalancesDueFromInstallmentCase";
import type { MaxDueFromInstallmentError, MaxDueFromInstallmentInput, MaxDueFromInstallmentOutput } from "../business/useCases/installment/MaxDueFromInstallmentCase";
import type { GetInstallmentByDebtAndNumberError } from "../business/useCases/installment/GetInstallmentByDebtAndNumberUseCase";

export interface MarkInstallAsPaidInGate {
    payStatus: InstallmentStatus;
    idInstallment: string
    companyId: string
    auditorNotes: string
    isLife: boolean
}

export interface InstallmentGateway {
    markInstallAsPaid(input: MarkInstallAsPaidInGate): Promise<Result<MarkInstallAsPaidOutput, MarkInstallAsPaidError>>;


    maxDueFromInstallment(input: MaxDueFromInstallmentInput): Promise<Result<MaxDueFromInstallmentOutput, MaxDueFromInstallmentError>>

    balancesDueFromDebt(input: BalancesDueFromInstallmentInput): Promise<Result<BalancesDueFromInstallmentOutput, BalancesDueFromInstallmentError>>

    createForNewDebt(input: CreateInstallmentsGatewayInput): Promise<CreateInstallmentsOutput>

    createMany(input: {
        companyId: string;
        installments: Installment[];
    }): Promise<Result<void, CreateInstallmentsError>>;

    getByCollector(input: GetByCollectorInput): Promise<Result<GetByCollectorOutput, GetByCollectorError>>

    updateByDebt(input: UpdateInstallmentByDebtInput): Promise<UpdateInstallmentByDebtOutput>;

    updateById(input: UpdateByIdInput): Promise<Result<UpdateByIdOutput, UpdateByIdError>>


    getByDebt(input: GetInstallmentsByDebtInput): Promise<GetInstallmentsByDebtOutput>;
    getById(input: GetByIdInput): Promise<Result<GetByIdOutput, GetByIdError>>
    /**
     * Obtiene una cuota por id de deuda y numero de cuota
     * @param input 
     * @returns 
     */
    getByDebtAndNumber(input: {
        companyId: string;
        debtId: string;
        installmentNumber: number;
    }): Promise<Result<Installment | null, GetInstallmentByDebtAndNumberError>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteBatch(companyId: string, installmentIds: string[]): Promise<Result<null, any>>;

    getInstallmentsSummaryByDateRange(input: {
        companyId: string;
        startDate: string;
        endDate: string;
    }): Promise<Result<{
        totalAmount: number;
        totalPaidAmount: number;
        totalPaidLatePayment: number;
        totalLatePayment: number;
    }, any>>;

    getPendingInstallmentsForCollector(input: GetManagementInstallmentsInput): Promise<Result<Installment[], any>>;

    getPendingInstallmentsForCollectorByRoutes(
        input: GetManagementInstallmentsByRoutesInput
    ): Promise<Result<Installment[], GetManagementInstallmentsByRoutesError>>;

}