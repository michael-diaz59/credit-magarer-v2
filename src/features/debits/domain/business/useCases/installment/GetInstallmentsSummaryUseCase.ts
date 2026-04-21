import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type { InstallmentGateway } from "../../../infraestructure/DebtGatweay";

export interface GetInstallmentsSummaryInput {
    companyId: string;
    startDate: string;
    endDate: string;
}

export interface GetInstallmentsSummaryOutput {
    totalAmount: number;
    totalPaidAmount: number;
    totalPaidLatePayment: number;
    totalLatePayment: number;
    expectedPayment: number;
    paymentExpectedToDelay: number;
}

export type GetInstallmentsSummaryError =
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class GetInstallmentsSummaryUseCase {
    private gateway: InstallmentGateway;

    constructor(gateway: InstallmentGateway) {
        this.gateway = gateway;
    }

    async execute(input: GetInstallmentsSummaryInput): Promise<Result<GetInstallmentsSummaryOutput, GetInstallmentsSummaryError>> {
        try {
            const result = await this.gateway.getInstallmentsSummaryByDateRange(input);

            if (!result.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const data = result.value;

            return ok({
                ...data,
                expectedPayment: data.totalAmount - data.totalPaidAmount,
                paymentExpectedToDelay: data.totalPaidLatePayment - data.totalLatePayment,
            });
        } catch (error) {
            console.error("[GetInstallmentsSummaryUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
