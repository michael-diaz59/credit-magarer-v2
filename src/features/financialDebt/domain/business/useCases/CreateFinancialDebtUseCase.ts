
import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type FinancialDebtGateway from "../../infraestructure/FinancialDebtGateway";
import type { FinancialDebt } from "../entities/FinancialDebt";

export interface CreateFinancialDebtInput {
    companyId: string;
    amount: number;
    installmentAmount: number;
    periocidad: "mensual" | "quincenal";
    startDate: string;
    file: File;
    createdAt: string; // YYYY-MM-DD
}

export interface CreateFinancialDebtOutput {
    financialDebtId: string;
}

export type CreateFinancialDebtError =
    | { code: "UPLOAD_ERROR" }
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class CreateFinancialDebtUseCase {
    private financialDebtGateway: FinancialDebtGateway;
    constructor(financialDebtGateway: FinancialDebtGateway) {
        this.financialDebtGateway = financialDebtGateway;
    }

    async execute(input: CreateFinancialDebtInput): Promise<Result<CreateFinancialDebtOutput, CreateFinancialDebtError>> {
        try {
            const id = this.financialDebtGateway.generateId(input.companyId);

            const uploadResult = await this.financialDebtGateway.uploadProof(
                input.companyId,
                id,
                input.file
            );

            if (!uploadResult.ok) {
                return fail({ code: "UPLOAD_ERROR" });
            }

            const idProof = uploadResult.value;

            const financialDebt: FinancialDebt = {
                id,
                name: "", // Will be set by repo transaction
                amount: input.amount,
                installmentAmount: input.installmentAmount,
                periocidad: input.periocidad,
                startDate: input.startDate,
                idProof,
                createdAt: input.createdAt,
            };

            const result = await this.financialDebtGateway.create(input.companyId, financialDebt);

            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            return ok({ financialDebtId: id });

        } catch (error) {
            console.error("Error in CreateFinancialDebtUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
