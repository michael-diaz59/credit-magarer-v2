import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";

export interface GetSumRenewalPaymentInput {
    companyId: string;
}

export interface GetSumRenewalPaymentOutput {
    totalRenewalPayment: number;
}

export type GetSumRenewalPaymentError = { code: "UNKNOWN_ERROR" } | { code: "NETWORK_ERROR" };

export class GetSumRenewalPaymentUseCase {
    private debtGateway: DebtGateway;

    constructor(debtGateway: DebtGateway) {
        this.debtGateway = debtGateway;
    }

    async execute(input: GetSumRenewalPaymentInput): Promise<Result<GetSumRenewalPaymentOutput, GetSumRenewalPaymentError>> {
        try {
            const result = await this.debtGateway.getSumOfRenewalPayment(input.companyId);

            if (!result.ok) {
                return fail(result.error);
            }

            return {
                ok: true,
                value: {
                    totalRenewalPayment: result.value
                }
            };
        } catch (error) {
            console.error("[GetSumRenewalPaymentUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
