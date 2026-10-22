import { ok, fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import {
  calculateDebtPaymentCapacity,
  type DebtPaymentCapacity,
} from "../../services/calculateDebtPaymentCapacity";

import type { Debt } from "../../entities/Debt";

export interface GetDebtPaymentCapacityInput {
  companyId: string;
  debtId: string;
  todayDateStr: string;
  debt?: Debt;
}

export type GetDebtPaymentCapacityOutput = DebtPaymentCapacity;

export type GetDebtPaymentCapacityError =
  | { code: "DEBT_NOT_FOUND" }
  | { code: "INSTALLMENTS_FETCH_FAILED" }
  | { code: "UNKNOWN_ERROR" };

export class GetDebtPaymentCapacityCase {
  private readonly installmentGateway: InstallmentGateway;
  private readonly debtGateway: DebtGateway;

  constructor(
    installmentGateway: InstallmentGateway,
    debtGateway: DebtGateway
  ) {
    this.installmentGateway = installmentGateway;
    this.debtGateway = debtGateway;
  }

  async execute(
    input: GetDebtPaymentCapacityInput
  ): Promise<Result<GetDebtPaymentCapacityOutput, GetDebtPaymentCapacityError>> {
    try {
      const { companyId, debtId, todayDateStr } = input;

      let debt = input.debt;
      if (!debt) {
        const debtResult = await this.debtGateway.getById({
          companyId,
          idDebt: debtId,
        });

        if (!debtResult.state.ok || !debtResult.state.value) {
          return fail({ code: "DEBT_NOT_FOUND" });
        }
        debt = debtResult.state.value;
      }

      const installmentsResult = await this.installmentGateway.getByDebt({
        companyId,
        debtId,
      });

      if (!installmentsResult.state.ok) {
        return fail({ code: "INSTALLMENTS_FETCH_FAILED" });
      }

      const allInstallments = installmentsResult.state.value;

      const capacity = calculateDebtPaymentCapacity(
        debt,
        allInstallments,
        todayDateStr
      );

      return ok(capacity);
    } catch (error) {
      console.error("[GetDebtPaymentCapacityCase] Error:", error);
      return fail({ code: "UNKNOWN_ERROR" });
    }
  }
}
