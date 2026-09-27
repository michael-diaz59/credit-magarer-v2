import type { Result } from "../../../../core/helpers/ResultC";
import { DisbursementRepository } from "../../repository/firebase/DisbursementRepository";
import { CreateDisbursementCase, type CreateDisbursementError, type CreateDisbursementInput, type CreateDisbursementOutput } from "../business/useCases/disbursement/CreateDisbursementCase";
import { GetPendentingsDisbursementCase, type GetPendentingsDisbursementError, type GetPendentingsDisbursementInput, type GetPendentingsDisbursementOutput } from "../business/useCases/disbursement/GetPendentingsDisbursementCase";
import { MarkDisbursementAsDeliveredCase, type MarkDisbursementAsDeliveredError, type MarkDisbursementAsDeliveredInput, type MarkDisbursementAsDeliveredOutput } from "../business/useCases/disbursement/MarkDisbursementAsDeliveredCase";
import { MarkDisbursementDeliveredAndActivateDebtCase, type MarkDisbursementDeliveredAndActivateDebtError, type MarkDisbursementDeliveredAndActivateDebtInput, type MarkDisbursementDeliveredAndActivateDebtOutput } from "../business/useCases/disbursement/MarkDisbursementDeliveredAndActivateDebt";
import type DisbursementGateway from "./DisbursementGateway";

export class DisbursementOrchestrator {
    private createDisbursementCase: CreateDisbursementCase;
    private getPendentingsDisbursementCase: GetPendentingsDisbursementCase;
    private markDisbursementAsDeliveredCase: MarkDisbursementAsDeliveredCase;
    private markDisbursementDeliveredAndActivateDebtCase: MarkDisbursementDeliveredAndActivateDebtCase;
    disbursementGateway: DisbursementGateway
    constructor() {
        this.disbursementGateway = new DisbursementRepository();
        this.createDisbursementCase = new CreateDisbursementCase(this.disbursementGateway);
        this.getPendentingsDisbursementCase = new GetPendentingsDisbursementCase(this.disbursementGateway);
        this.markDisbursementAsDeliveredCase = new MarkDisbursementAsDeliveredCase(this.disbursementGateway);
        this.markDisbursementDeliveredAndActivateDebtCase = new MarkDisbursementDeliveredAndActivateDebtCase(this.disbursementGateway);
    }

    createDisbursement(input: CreateDisbursementInput): Promise<Result<CreateDisbursementOutput, CreateDisbursementError>> {
        return this.createDisbursementCase.execute(input);
    }

    getPendentingsDisbursement(input: GetPendentingsDisbursementInput): Promise<Result<GetPendentingsDisbursementOutput, GetPendentingsDisbursementError>> {
        return this.getPendentingsDisbursementCase.execute(input);
    }

    markDisbursementAsDelivered(input: MarkDisbursementAsDeliveredInput): Promise<Result<MarkDisbursementAsDeliveredOutput, MarkDisbursementAsDeliveredError>> {
        return this.markDisbursementAsDeliveredCase.execute(input);
    }

    markDisbursementDeliveredAndActivateDebt(input: MarkDisbursementDeliveredAndActivateDebtInput): Promise<Result<MarkDisbursementDeliveredAndActivateDebtOutput, MarkDisbursementDeliveredAndActivateDebtError>> {
        return this.markDisbursementDeliveredAndActivateDebtCase.execute(input);
    }
}