import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { CompanyGateway } from "../../infraestructure/CompanyGateway";
import type { Income } from "../entities/Income";


export interface CreateCompanyIncomeInput {
    companyId: string;
    income: Income;
    file?: File;
}

export interface RegisterCompanyIncomeOutput {
    incomeId: string;
}

export type RegisterCompanyIncomeError =
    | { code: "UPLOAD_ERROR" }
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class RegisterCompanyIncomeUseCase {
    private gateway: CompanyGateway;

    constructor(gateway: CompanyGateway) {
        this.gateway = gateway;
    }

    async execute(input: CreateCompanyIncomeInput): Promise<Result<RegisterCompanyIncomeOutput, RegisterCompanyIncomeError>> {
        try {
            // Paso 1: crear el Income en Firestore → Firebase asigna el ID
            const createResult = await this.gateway.createIncomeAndUpdateAccount(input);
            if (!createResult.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            const incomeId = createResult.value;

            // Paso 2: si hay archivo, subirlo usando el ID recién asignado
            if (input.file) {
                const uploadResult = await this.gateway.uploadIncomeProof(
                    input.companyId,
                    incomeId,
                    input.file
                );
                if (!uploadResult.ok) {
                    return fail({ code: "UPLOAD_ERROR" });
                }

                // Paso 3: actualizar idProof en el documento
                const updateResult = await this.gateway.updateIncomeProof(
                    input.companyId,
                    incomeId,
                    uploadResult.value
                );
                if (!updateResult.ok) {
                    return fail({ code: "PERSISTENCE_ERROR" });
                }
            }

            return ok({ incomeId });
        } catch (error) {
            console.error("[RegisterCompanyIncomeUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
