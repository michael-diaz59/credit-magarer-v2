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

export interface MarkInstallAsPaidInGate {
    payStatus: InstallmentStatus;
    idInstallment: string
    companyId: string
    auditorNotes: string
}

export interface InstallmentGateway {
    markInstallAsPaid(input: MarkInstallAsPaidInGate): Promise<Result<MarkInstallAsPaidOutput, MarkInstallAsPaidError>>;

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
    }): Promise<Result<Installment | null, any>>;
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
        input: import("../business/useCases/installment/GetManagementInstallmentsByRoutesUseCase").GetManagementInstallmentsByRoutesInput
    ): Promise<Result<Installment[], import("../business/useCases/installment/GetManagementInstallmentsByRoutesUseCase").GetManagementInstallmentsByRoutesError>>;

}