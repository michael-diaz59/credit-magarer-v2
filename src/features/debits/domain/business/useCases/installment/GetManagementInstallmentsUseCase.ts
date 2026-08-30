import { type Result } from "../../../../../../core/helpers/ResultC";
import type { Installment } from "../../entities/Installment";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";

export type GetManagementInstallmentsError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

/**representa las cuotas que estan asignadas a una ruta*/
export interface GetManagementInstallmentsInput {
  companyId: string;
  routeId: string;
  today: string;
}

export type GetManagementInstallmentsOutput = Installment[];

export class GetManagementInstallmentsUseCase {
  private readonly installmentGateway: InstallmentGateway;

  constructor(installmentGateway: InstallmentGateway) {
    this.installmentGateway = installmentGateway;
  }

  async execute(
    input: GetManagementInstallmentsInput
  ): Promise<Result<GetManagementInstallmentsOutput, GetManagementInstallmentsError>> {
    return this.installmentGateway.getPendingInstallmentsForCollector(input);
  }
}
