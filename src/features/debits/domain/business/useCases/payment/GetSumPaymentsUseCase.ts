import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentGateway } from "../../../infraestructure/PaymentGateway";

export interface GetSumPaymentsInput {
    companyId: string;
}

export interface GetSumPaymentsOutput {
    totalPayments: number;
}

export type GetSumPaymentsError = { code: "UNKNOWN_ERROR" } | { code: "NETWORK_ERROR" };

export class GetSumPaymentsUseCase {
    private gateway: PaymentGateway;

    constructor(gateway: PaymentGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetSumPaymentsInput): Promise<Result<GetSumPaymentsOutput, GetSumPaymentsError>> {
        try {
            const result = await this.gateway.getSumPayments(input.companyId);

            if (!result.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            return {
                ok: true,
                value: {
                    totalPayments: result.value
                }
            };
        } catch (error) {
            console.error("[GetSumPaymentsUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
