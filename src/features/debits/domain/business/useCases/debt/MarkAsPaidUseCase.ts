import { type Result } from "../../../../../../core/helpers/ResultC";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";

export interface MarkAsPaidInput {
  debtId: string;
  companyId: string;
  auditorNotes: string;
}

export interface MarkAsPaidOutput {
  state: null;
}

export type MarkAsPaidError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" }
  | { code: "DEBT_NOT_FOUND" }
  | { code: "fORBIDEN" }
  | { code: "AUDITORNOTEREQUERIDE" }

export class MarkAsPaidUseCase {
  private debtGateway: DebtGateway;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
  }

  async execute(
    input: MarkAsPaidInput
  ): Promise<Result<MarkAsPaidOutput, MarkAsPaidError>> {
    const result = await this.debtGateway.markAsPaid({
      auditorNotes: input.auditorNotes,
      debtId: input.debtId,
      companyId: input.companyId,
      newStatus: "pagada",
    });

    return result;
  }
}
