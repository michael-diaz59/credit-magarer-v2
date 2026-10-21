import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC";
import type { Installment } from "../../entities/Installment";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";

export interface GetInstallmentByDebtAndNumberInput {
  companyId: string;
  debtId: string;
  installmentNumber: number;
}

export interface GetInstallmentByDebtAndNumberOutput {
  installment: Installment | null;
}

export type GetInstallmentByDebtAndNumberError =
  | { code: "UNKNOWN_ERROR"; message: string }
  | { code: "NETWORK_ERROR"; message: string };

export class GetInstallmentByDebtAndNumberUseCase {
  private readonly installmentGateway: InstallmentGateway;

  constructor(installmentGateway: InstallmentGateway) {
    this.installmentGateway = installmentGateway;
  }

  async execute(
    input: GetInstallmentByDebtAndNumberInput
  ): Promise<Result<GetInstallmentByDebtAndNumberOutput, GetInstallmentByDebtAndNumberError>> {
    try {
      const result = await this.installmentGateway.getByDebtAndNumber({
        companyId: input.companyId,
        debtId: input.debtId,
        installmentNumber: input.installmentNumber,
      });

      if (!result.ok) {
        return fail(result.error);
      }

      return ok({ installment: result.value });
    } catch (error) {
      return fail({
        code: "UNKNOWN_ERROR",
        message: error instanceof Error ? error.message : "Error inesperado al buscar la cuota",
      });
    }
  }
}
