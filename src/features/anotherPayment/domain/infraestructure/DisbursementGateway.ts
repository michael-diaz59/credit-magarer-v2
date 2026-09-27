import type { Result } from "../../../../core/helpers/ResultC";
import type { Installment } from "../../../debits/domain/business/entities/Installment";
import type { Disbursement } from "../business/entities/Disbursement";
import type { CreateDisbursementError, CreateDisbursementOutput } from "../business/useCases/disbursement/CreateDisbursementCase";
import type { GetPendentingsDisbursementError, GetPendentingsDisbursementInput, GetPendentingsDisbursementOutput } from "../business/useCases/disbursement/GetPendentingsDisbursementCase";
import type { GetPendentingsDisbursementForCollectorError, GetPendentingsDisbursementForCollectorInput, GetPendentingsDisbursementForCollectorOutput } from "../business/useCases/disbursement/GetPendentingsDisbursementForCollectorCase";
import type { MarkDisbursementAsDeliveredError, MarkDisbursementAsDeliveredInput, MarkDisbursementAsDeliveredOutput } from "../business/useCases/disbursement/MarkDisbursementAsDeliveredCase";
import type { MarkDisbursementDeliveredAndActivateDebtError, MarkDisbursementDeliveredAndActivateDebtOutput } from "../business/useCases/disbursement/MarkDisbursementDeliveredAndActivateDebt";

export interface createGatewayInput {
    disbursement: Disbursement;
    companyId: string;
    file?: File
}

export interface MarkDisbursementDeliveryItem {
    disbursement: Disbursement;
    debtId: string;
    installments: Installment[];
}

export interface MarkDisbursementsAsDeliveredInput {
    companyId: string;
    items: MarkDisbursementDeliveryItem[];
}

export default interface DisbursementGateway {
    create(input: createGatewayInput): Promise<Result<CreateDisbursementOutput, CreateDisbursementError>>;

    markAsDeliveredAndActivateDebt(input: MarkDisbursementsAsDeliveredInput):
        Promise<Result<MarkDisbursementDeliveredAndActivateDebtOutput, MarkDisbursementDeliveredAndActivateDebtError>>;

    getPendentingsDisbursementForCollector(input: GetPendentingsDisbursementForCollectorInput):
        Promise<Result<GetPendentingsDisbursementForCollectorOutput, GetPendentingsDisbursementForCollectorError>>;

    getPendentingsDisbursement(input: GetPendentingsDisbursementInput): Promise<Result<GetPendentingsDisbursementOutput, GetPendentingsDisbursementError>>;
    markDisbursementAsDelivered(input: MarkDisbursementAsDeliveredInput): Promise<Result<MarkDisbursementAsDeliveredOutput, MarkDisbursementAsDeliveredError>>
}
