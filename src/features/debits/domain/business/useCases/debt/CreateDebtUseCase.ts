
import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import CustomerOrchestrator from "../../../../../costumers/domain/infraestructure/CustomerOrchestrator";
import type { DebtGateway } from "../../../infraestructure/DebtGatweay";
import type { Debt } from "../../entities/Debt";
import type { Installment } from "../../entities/Installment";
import { generateInstallments } from "../helper";

export type CreateDebtError =
  | { code: "NETWORK_ERROR" }
  | { code: "UNKNOWN_ERROR" }
  | { code: "STATE_INVALID" }
  | { code: "CUSTOMER_NOT_FOUND" }
  | { code: "el monton total debe ser mayor a 1000" }

export interface CreateDebtUInput {
  debt: Omit<Debt, "id">;
  companyId: string
}


export interface CreateDebtUOutput {
  state: null
}

export interface createWithInstallmentsInput {
  companyId: string;
  debt: Debt;
  installments: Installment[];
}

export class CreateDebtUseCase {
  private debtGateway: DebtGateway;
  private costumerOrchestrator: CustomerOrchestrator;

  constructor(debtGateway: DebtGateway) {
    this.debtGateway = debtGateway;
    this.costumerOrchestrator = new CustomerOrchestrator();
  }

  async execute(input: CreateDebtUInput): Promise<Result<CreateDebtUOutput, CreateDebtError>> {
    /** 1️⃣ Estado válido */
    if (input.debt.status !== "tentativa") {
      return fail({ code: "STATE_INVALID" });
    }

    console.log(input.debt.totalAmount)
    if (input.debt.totalAmount < 1000) {
      return fail({ code: "el monton total debe ser mayor a 1000" });
    }

    /** 2️⃣ Buscar cliente */
    const costumerResult =
      await this.costumerOrchestrator.getCostumerByIdNumber({
        companyId: input.companyId,
        documentId: input.debt.costumerDocument,
      });

    if (!costumerResult.state.ok) {
      return fail({ code: "UNKNOWN_ERROR" });
    }

    if (!costumerResult.state.value) {
      return fail({ code: "CUSTOMER_NOT_FOUND" });
    }

    const costumer = costumerResult.state.value;

    /** 3️⃣ Debt FINAL */
    const debt: Debt = {
      ...input.debt,
      id: crypto.randomUUID(),
      clientId: costumer.id,
      costumerName: costumer.applicant.fullName,
      createdAt: new Date().toISOString().slice(0, 10),
      firstDueDate: "", // se calcula abajo
    };

    /** 4️⃣ Generar cuotas */
    const { installments, firstDueDate, nextPaymentDue } = generateInstallments(
      debt,
      costumer.applicant.address
    );

    debt.nextPaymentDue = nextPaymentDue;
    debt.overdueInstallmentsCount = 0;

    debt.firstDueDate = firstDueDate;

    /** 5️⃣ Persistir TODO */
    return await this.debtGateway.createWithInstallments({
      companyId: input.companyId,
      debt,
      installments,
    });
  }
}
