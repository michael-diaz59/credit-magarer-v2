
import { ok, fail, type Result } from "../../../../../core/helpers/ResultC";
import type { Payroll } from "../entities/Payroll";
import type { PayrollGateway } from "../../infraestructure/PayrollGateway";

export interface GetPayrollPaymentsByUserInput {
    companyId: string;
    userId: string;
}

export type GetPayrollPaymentsByUserError = { code: "UNKNOWN_ERROR" };

export class GetPayrollPaymentsByUserUseCase {
    private payrollGateway: PayrollGateway;

    constructor(payrollGateway: PayrollGateway) {
        this.payrollGateway = payrollGateway;
    }

    async execute(input: GetPayrollPaymentsByUserInput): Promise<Result<Payroll[], GetPayrollPaymentsByUserError>> {
        try {
            const result = await this.payrollGateway.getPaymentsByUserId(input.companyId, input.userId);
            if (result.ok) {
                return ok(result.value);
            }
            return fail({ code: "UNKNOWN_ERROR" });
        } catch (error) {
            console.error("Error in GetPayrollPaymentsByUserUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
