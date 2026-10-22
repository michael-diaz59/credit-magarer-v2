import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { Debt } from "../../entities/Debt";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { DebtPaymentCapacity } from "../../services/calculateDebtPaymentCapacity";
import { GetDebtPaymentCapacityCase } from "./GetDebtPaymentCapacityCase";

export interface GetDebtsPaymentCapacitiesInput {
  companyId: string;
  debts: Debt[];
  todayDateStr: string;
}

export interface GetDebtsPaymentCapacitiesOutput {
  capacities: Record<string, DebtPaymentCapacity>;
}

export type GetDebtsPaymentCapacitiesError =
  | { code: "FETCH_FAILED" }
  | { code: "UNKNOWN_ERROR" };

export class GetDebtsPaymentCapacitiesUseCase {
  private readonly getDebtPaymentCapacityCase: GetDebtPaymentCapacityCase;

  constructor(
    installmentGateway: InstallmentGateway,
    debtGateway: DebtGateway
  ) {
    this.getDebtPaymentCapacityCase = new GetDebtPaymentCapacityCase(
      installmentGateway,
      debtGateway
    );
  }

  async execute(
    input: GetDebtsPaymentCapacitiesInput
  ): Promise<Result<GetDebtsPaymentCapacitiesOutput, GetDebtsPaymentCapacitiesError>> {
    try {
      const { companyId, debts, todayDateStr } = input;
      const capacities: Record<string, DebtPaymentCapacity> = {};

      const promises = debts.map(async (debt) => {
        try {
          const result = await this.getDebtPaymentCapacityCase.execute({
            companyId,
            debtId: debt.id,
            todayDateStr,
            debt,
          });

          if (result.ok) {
            capacities[debt.id] = result.value;
          }
        } catch (err) {
          console.error(`[GetDebtsPaymentCapacitiesUseCase] Error for debt ${debt.id}:`, err);
        }
      });

      await Promise.all(promises);

      return ok({ capacities });
    } catch (error) {
      console.error("[GetDebtsPaymentCapacitiesUseCase] Unexpected error:", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }
}
