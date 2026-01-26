
import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import CostumerOrchestrator from "../../../../../costumers/domain/infraestructure/CostumerOrchestrator";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";

export type CreateDebtError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }
    | { code: "STATE_INVALID" }
    | { code: "CUSTOMER_NOT_FOUND" }

export interface CreateDebtUInput {
    debt:  Omit<Debt, "id">;
    companyId:string
}


export interface CreateDebtUOutput {
    state: Result<null, CreateDebtError>
}

export class CreateDebtUseCase {
    private debtGateway: DebtGateway
      private costumerOrchestrator: CostumerOrchestrator;
    constructor(
        debtGateway: DebtGateway
    ) {
        this.debtGateway = debtGateway
        this.costumerOrchestrator = new CostumerOrchestrator();
    }

    /**valida que se cree un debt con estado "tentativa" */
    async execute(input: CreateDebtUInput): Promise<CreateDebtUOutput> {
    /** 1️⃣ Validación de estado */
    if (input.debt.status !== "tentativa") {
      return {
        state: fail({ code: "STATE_INVALID" }),
      };
    }

    /** 2️⃣ Buscar customer */
    const costumerResult =
      await this.costumerOrchestrator.getCostumerByIdNumber({
        companyId: input.companyId,
        documentId: input.debt.costumerDocument,
      });

    if (!costumerResult.state.ok || costumerResult.state.value===null) {
      return {
        state: fail({ code: "CUSTOMER_NOT_FOUND" }),
      };
    }

    const costumer = costumerResult.state.value;

    /** 🔥 3️⃣ Debt FINAL (fuente de la verdad) */
    const debtToSave: Debt = {
      ...input.debt,

      id: crypto.randomUUID(),

      clientId: costumer.id,
      costumerName: costumer.applicant.fullName,

      createdAt:
        input.debt.createdAt || new Date().toISOString().slice(0, 10),
    };

    /** 4️⃣ Persistir */
    return await this.debtGateway.create({
      companyId: input.companyId,
      debt: debtToSave,
    });
  }
}
