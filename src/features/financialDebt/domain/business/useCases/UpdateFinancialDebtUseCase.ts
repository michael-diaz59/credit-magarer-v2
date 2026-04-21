
import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type FinancialDebtGateway from "../../infraestructure/FinancialDebtGateway";
import type { FinancialDebt } from "../entities/FinancialDebt";

export interface UpdateFinancialDebtInput {
    companyId: string;
    financialDebt: FinancialDebt;
    newFile?: File; // Optional if updating the proof
}

export type UpdateFinancialDebtError =
    | { code: "UPLOAD_ERROR" }
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class UpdateFinancialDebtUseCase {
    private financialDebtGateway: FinancialDebtGateway;
    constructor(financialDebtGateway: FinancialDebtGateway) {
        this.financialDebtGateway = financialDebtGateway;
    }

    async execute(input: UpdateFinancialDebtInput): Promise<Result<void, UpdateFinancialDebtError>> {
        try {
            let idProof = input.financialDebt.idProof;

            if (input.newFile) {
                const uploadResult = await this.financialDebtGateway.uploadProof(
                    input.companyId,
                    input.financialDebt.id,
                    input.newFile
                );

                if (!uploadResult.ok) {
                    return fail({ code: "UPLOAD_ERROR" });
                }
                idProof = uploadResult.value;
            }

            const updatedDebt: FinancialDebt = {
                ...input.financialDebt,
                idProof,
            };

            const result = await this.financialDebtGateway.update(input.companyId, updatedDebt);

            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            return ok(undefined);

        } catch (error) {
            console.error("Error in UpdateFinancialDebtUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
