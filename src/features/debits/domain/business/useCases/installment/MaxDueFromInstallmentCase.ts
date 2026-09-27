import type { Result } from "../../../../../../core/helpers/ResultC";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";

export interface MaxDueFromInstallmentInput {
    companyId: string;
    installmentId: string;
}
export interface MaxDueFromInstallmentOutput {
    maxOutstandingAmount: number;
    maxArrears: number;
}
export interface MaxDueFromInstallmentError {
    code: string;
}

export class MaxDueFromInstallmentCase {

    private readonly installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway
    ) {
        this.installmentGateway = installmentGateway
    }

    async execute(input: MaxDueFromInstallmentInput): Promise<Result<MaxDueFromInstallmentOutput, MaxDueFromInstallmentError>> {
        return this.installmentGateway.maxDueFromInstallment(input);
    }
}