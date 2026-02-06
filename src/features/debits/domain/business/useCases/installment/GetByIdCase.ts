import { fail, ok, type Result } from "../../../../../../core/helpers/ResultC"
import type { InstallmentGateway } from "../../../infraestructure/DebtGatweay"
import type { Installment } from "../../entities/Installment"

export type GetByIdError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }
        | { code: "INSTALLMENT_WHITHOUSE_COLLECTOR" }


export interface GetByIdInput {
    collectorId:string
    companyId:string
    installmentId: string

}

export interface GetByIdOutput {
    state: Installment
}

/** obtiene un installment, idealmente poner logica para evitar que un colector vea installment que no estan asociados a el*/
export class GetByIdCase {
    private installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }
    /** obtiene un installment, idealmente poner logica para evitar que un colector vea installment que no estan asociados a el*/
    async execute(input: GetByIdInput): Promise<Result<GetByIdOutput,GetByIdError>> {
          const result = await this.installmentGateway.getById(input);

  if (!result.ok) {
    return result;
  }

  const installment = result.value.state;

  // 🔐 VALIDACIÓN DE NEGOCIO
  if (installment.collectorId !== input.collectorId) {
    return fail({ code: "INSTALLMENT_WHITHOUSE_COLLECTOR" });
  }

  return ok({
    state: installment,
  });
    }
}