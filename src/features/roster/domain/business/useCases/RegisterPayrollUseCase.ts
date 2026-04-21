
import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { PayrollGateway } from "../../infraestructure/PayrollGateway";
import type { Payroll } from "../entities/Payroll";

export interface RegisterPayrollInput {
    companyId: string;
    userId: string;
    amount: number;
    method: "efectivo" | "consignacion";
    bankAccountId?: string;
    file?: File;
}

export interface RegisterPayrollOutput {
    payrollId: string;
}

export type RegisterPayrollError = 
    | { code: "UPLOAD_ERROR" }
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class RegisterPayrollUseCase {
    private payrollGateway: PayrollGateway;
    constructor(payrollGateway: PayrollGateway) {
        this.payrollGateway = payrollGateway;
    }

    async execute(input: RegisterPayrollInput): Promise<Result<RegisterPayrollOutput, RegisterPayrollError>> {
        try {
            const payrollId = this.payrollGateway.generateId(input.companyId);
            let idProof = "";

            if (input.method === "consignacion" && input.file) {
                const uploadResult = await this.payrollGateway.uploadProof(
                    input.companyId,
                    payrollId,
                    input.file
                );

                if (!uploadResult.ok) {
                    return fail({ code: "UPLOAD_ERROR" });
                }
                idProof = uploadResult.value;
            }

            const payroll: Payroll = {
                id: payrollId,
                userId: input.userId,
                companyId: input.companyId,
                amount: input.amount,
                method: input.method,
                status: "registrado",
                idProof: idProof,
                bankAccountId: input.bankAccountId,
                createdAt: new Date().toISOString().slice(0, 10), // aaaa-mm-dd
            };

            const result = await this.payrollGateway.register(input.companyId, payroll);
            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            return ok({ payrollId });
        } catch (error) {
            console.error("Error in RegisterPayrollUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
