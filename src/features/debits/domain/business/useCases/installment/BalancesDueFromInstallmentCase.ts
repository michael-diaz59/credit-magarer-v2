import type { Result } from "../../../../../../core/helpers/ResultC";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";

export interface BalancesDueFromInstallmentInput {
    companyId: string;
    debtId: string;
}

export interface BalancesDueFromInstallmentOutput {
    sumAmount: number;
    sumDeferment: number;
    sumArrears: number;
}

export interface BalancesDueFromInstallmentError {
    code: "UNKNOWN_ERROR" | "NETWORK_ERROR" | "FORBIDDEN" | "INSTALLMENT_NOT_FOUND";
}

export class BalancesDueFromInstallmentCase {
    private installmentGateway: InstallmentGateway;
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway;
    }

    async execute(input: BalancesDueFromInstallmentInput): Promise<Result<BalancesDueFromInstallmentOutput, BalancesDueFromInstallmentError>> {
        const { companyId, debtId: installmentId } = input;
        const result = await this.installmentGateway.balancesDueFromDebt({
            companyId,
            debtId: installmentId,
        });
        return result;
    }
}