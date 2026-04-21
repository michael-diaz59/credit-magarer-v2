
import { ok, fail, type Result } from "../../../../../core/helpers/ResultC";
import type { Payroll } from "../entities/Payroll";
import type { PayrollGateway } from "../../infraestructure/PayrollGateway";

export interface GetPayrollPaymentByIdInput {
    companyId: string;
    payrollId: string;
}

export type GetPayrollPaymentByIdError = { code: "NOT_FOUND" } | { code: "UNKNOWN_ERROR" };

export class GetPayrollPaymentByIdUseCase {
    private payrollGateway: PayrollGateway;

    constructor(payrollGateway: PayrollGateway) {
        this.payrollGateway = payrollGateway;
    }

    async execute(input: GetPayrollPaymentByIdInput): Promise<Result<Payroll, GetPayrollPaymentByIdError>> {
        try {
            const result = await this.payrollGateway.getPaymentById(input.companyId, input.payrollId);
            if (result.ok) {
                if (result.value) {
                    return ok(result.value);
                }
                return fail({ code: "NOT_FOUND" });
            }
            return fail({ code: "UNKNOWN_ERROR" });
        } catch (error) {
            console.error("Error in GetPayrollPaymentByIdUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
