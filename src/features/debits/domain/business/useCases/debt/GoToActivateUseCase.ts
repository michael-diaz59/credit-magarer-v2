import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { Customer } from "../../../../../costumers/domain/business/entities/Customer";
import type CostumerGateway from "../../../../../costumers/domain/infraestructure/CostumerGateway";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import { type Debt } from "../../entities/Debt";
import { generateInstallments2 } from "../helper";

export interface GoToActivateInput {
  debt: Debt;
  companyId: string;
  reactive: boolean
}

export interface GoToActivateError {
  code: "NO_DEBT_ACTIVE" | "ERROR_DEBT_UPDATE" | "CUSTOMER_NOT_FOUND";
}

export interface GoToActivateOutput {
  state: null;
}

export class GoToActivateUseCase {
  private debtGateway: DebtGateway;
  private costumerGateway: CostumerGateway;

  constructor(debtGateway: DebtGateway, costumerGateway: CostumerGateway) {
    this.debtGateway = debtGateway;
    this.costumerGateway = costumerGateway;
  }

  async execute(
    input: GoToActivateInput
  ): Promise<Result<GoToActivateOutput, GoToActivateError>> {
    const { debt } = input
    console.log("startDate:" + debt.startDate);
    /** 2️⃣ Buscar cliente */
    const clientResult =
      await this.costumerGateway.getCostumerByIdNumber({
        companyId: input.companyId,
        documentId: input.debt.clientDocument,
      });

    if (!clientResult.state.ok) {
      return fail({ code: "CUSTOMER_NOT_FOUND" });
    }

    if (!clientResult.state.value) {
      return fail({ code: "CUSTOMER_NOT_FOUND" });
    }

    let result: Result<GoToActivateOutput, GoToActivateError>;
    if (input.reactive) {
      result = await this.debtGateway.goToReactivate({
        companyId: input.companyId,
        debtId: input.debt.id,
        installments: []
      });

    } else {
      const costumer: Customer = clientResult.state.value;
      debt.status = "activa";
      const { installments } = generateInstallments2(
        debt,
        costumer.applicant.address,
        costumer.applicant.phone,
        input.companyId,
      );

      result = await this.debtGateway.goToActivate({
        companyId: input.companyId,
        debtId: input.debt.id,
        installments,
      });
    }
    return result;
  }
}
