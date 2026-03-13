import type { Result } from "../../../../../../core/helpers/ResultC";
import { ok, fail } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway, InstallmentGateway } from "../../../infraestructure/DebtGatweay";
import type { Installment } from "../../entities/Installment";

export interface GetNextInstallmentsByCollectorInput {
    companyId: string;
    collectorId: string;
}

export interface GetNextInstallmentsByCollectorOutput {
    state: Installment[];
}

export type GetNextInstallmentsByCollectorError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" };

export class GetNextInstallmentsByCollectorUseCase {
    private readonly debtGateway: DebtGateway;
    private readonly installmentGateway: InstallmentGateway;

    constructor(
        debtGateway: DebtGateway,
        installmentGateway: InstallmentGateway
    ) {
        this.debtGateway = debtGateway;
        this.installmentGateway = installmentGateway;
    }

    async execute(input: GetNextInstallmentsByCollectorInput): Promise<Result<GetNextInstallmentsByCollectorOutput, GetNextInstallmentsByCollectorError>> {
        try {
            const today = new Date().toISOString().split("T")[0];

            // 1. Obtener deudas activas o en mora con nextPaymentDue <= today
            const debtsResult = await this.debtGateway.getDebtsByCollectorAndStatus({
                companyId: input.companyId,
                collectorId: input.collectorId,
                statuses: ["activa", "en_mora"],
                dateLimit: today
            });

            if (!debtsResult.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const debtsResultOutput = debtsResult.value;
            const debtsStateResult = debtsResultOutput.state;

            if (!debtsStateResult.ok) {
                return fail({ code: "UNKNOWN_ERROR" });
            }

            const debts = debtsStateResult.value;
            const installments: Installment[] = [];

            // 2. Para cada deuda, traer el installment correspondiente
            const installmentPromises = debts.map(async (debt) => {
                const nextNumber = (debt.installmentsPaid ?? 0) + 1;
                const instResult = await this.installmentGateway.getByDebtAndNumber({
                    companyId: input.companyId,
                    debtId: debt.id,
                    installmentNumber: nextNumber
                });

                if (instResult.ok && instResult.value) {
                    return instResult.value;
                }
                return null;
            });

            const results = await Promise.all(installmentPromises);

            for (const inst of results) {
                if (inst) {
                    installments.push(inst);
                }
            }

            return ok({ state: installments });

        } catch (error) {
            console.error("[GetNextInstallmentsByCollectorUseCase]", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
