import { type Result } from "../../../../../../core/helpers/ResultC";
import type { Installment } from "../../entities/Installment";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";

export type GetManagementInstallmentsByRoutesError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

export interface GetManagementInstallmentsByRoutesInput {
  companyId: string;
  routeIds: string[];
  today: string;
}

export type GetManagementInstallmentsByRoutesOutput = Installment[];

export class GetManagementInstallmentsByRoutesUseCase {
  private readonly installmentGateway: InstallmentGateway;

  constructor(installmentGateway: InstallmentGateway) {
    this.installmentGateway = installmentGateway;
  }

  async execute(
    input: GetManagementInstallmentsByRoutesInput
  ): Promise<Result<GetManagementInstallmentsByRoutesOutput, GetManagementInstallmentsByRoutesError>> {
    return this.installmentGateway.getPendingInstallmentsForCollectorByRoutes(input);
  }
}
