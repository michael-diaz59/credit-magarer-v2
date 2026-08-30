import type { Result } from "../../../../../../core/helpers/ResultC";
import type { Customer } from "../../../../../costumers/domain/business/entities/Customer";
import type { PersonalInfo } from "../../../../../costumers/domain/business/entities/PersonalInfo";
import type { InstallmentGateway } from "../../../infraestructure/InstallmentGateway";
import type { Debt, DebtTerms } from "../../entities/Debt";
import {
  defaultInstallment,
  type Installment,
  type InstallmentAddress,
} from "../../entities/Installment";

export type CreateInstallmentsError =
  | { code: "UNKNOWN_ERROR" }
  | { code: "NETWORK_ERROR" };

export interface CreateInstallmentsInput {
  debtId: string;
  debt: Debt;
  costumer: Customer;
  companyId: string;
}

export interface CreateInstallmentsOutput {
  state: Result<null, CreateInstallmentsError>;
}

export interface CreateInstallmentsGatewayInput {
  debtId: string;
  input: Omit<Installment, "id">[];
  companyId: string;
}

/**crea un conjunto de installments para un debt recien creado*/
export class CreateInstallmentsUseCase {
  private installmentGateway: InstallmentGateway;
  constructor(installmentGateway: InstallmentGateway) {
    this.installmentGateway = installmentGateway;
  }
  /**crea un conjunto de installments para un debt recien creado*/
  async execute(
    input: CreateInstallmentsInput,
  ): Promise<CreateInstallmentsOutput> {
    try {
      const { debt, costumer, companyId } = input;

      // 1️⃣ Mapear datos del costumer
      const costumerInstallmentData = this.mapCostumerToInstallmentData({
        costumerId: costumer.id,
        personalInfo: costumer.applicant,
      });

      // 2️⃣ Generar installments desde la deuda
      const installments: Omit<Installment, "id">[] =
        this.generateInstallmentsFromDebt(
          debt,
          costumerInstallmentData.clientAddres,
          costumer,
          companyId
        ).map((installment) => ({
          ...installment,
          clientId: costumerInstallmentData.clientId,
          clientNumber: costumerInstallmentData.clientNumber,
          clientDocument: costumerInstallmentData.clientDocument,
          clientName: costumerInstallmentData.clientName,

        }));

      // 3️⃣ Persistir (batch / update por debt)
      return await this.installmentGateway.createForNewDebt({
        input: installments,
        debtId: debt.id,
        companyId: companyId,
      });
    } catch {
      return { state: { ok: false, error: { code: "UNKNOWN_ERROR" } } };
    }
  }

  mapCostumerToInstallmentData(input: {
    costumerId: string;
    personalInfo: PersonalInfo;
  }): Pick<
    Installment,
    "clientId" | "clientDocument" | "clientName" | "clientAddres" | "clientNumber"
  > {
    const { costumerId, personalInfo } = input;

    return {
      clientId: costumerId,
      clientDocument: personalInfo.idNumber,
      clientName: personalInfo.fullName,
      clientNumber: personalInfo.phone,
      clientAddres: {
        address: personalInfo.address.address,
        neighborhood: personalInfo.address.neighborhood,
        stratum: personalInfo.address.stratum,
        city: personalInfo.address.city,
      },
    };
  }

  getNextDueDate(date: Date, term: DebtTerms): Date {
    const next = new Date(date);

    switch (term) {
      case "diario":
        next.setDate(next.getDate() + 1);
        break;

      case "semanal":
        next.setDate(next.getDate() + 7);
        break;

      case "quincenal":
        next.setDate(next.getDate() + 15);
        break;

      case "mensual":
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }

  formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  generateInstallmentsFromDebt(
    debt: Debt,
    costumerAddress: InstallmentAddress,
    customer: Customer,
    companyId: string,
    options?: {
      startNumber?: number;
      installmentCount?: number;
      firstDueDate?: string;
    },
  ): Omit<Installment, "id">[] {
    const startNumber = options?.startNumber ?? 1;
    const count = options?.installmentCount ?? debt.installmentCount;
    const firstDueDateStr = options?.firstDueDate ?? debt.startDate;

    const totalWithInterest = debt.amount * (1 + debt.interestRate / 100);

    const installmentAmount = Number(
      (totalWithInterest / debt.installmentCount).toFixed(2),
    );

    const installments: Omit<Installment, "id">[] = [];

    let dueDate = new Date(firstDueDateStr);
    const capitalPerInstallment = debt.capital / debt.installmentCount;
    let capitalToInstallment;
    let interesToInstallment;
    if (installmentAmount <= capitalPerInstallment) {
      capitalToInstallment = installmentAmount;
      interesToInstallment = 0
    } else {
      capitalToInstallment = capitalPerInstallment;
      interesToInstallment = installmentAmount - capitalPerInstallment;
    }


    for (let i = 0; i < count; i++) {
      const currentInstallmentNumber = startNumber + i;
      installments.push({
        ...defaultInstallment(),
        capital: capitalToInstallment,
        interest: interesToInstallment,
        installmentTotalNumber: debt.installmentCount,
        deferred: false,
        companyId: companyId,
        routeId: debt.routeId,
        attemptedCollection: false,
        debtId: debt.id,
        interestRate: debt.interestRate,
        clientId: debt.clientId,
        clientDocument: debt.clientDocument,
        clientName: debt.clientName,
        clientAddres: costumerAddress,
        clientNumber: customer.applicant.phone,
        installmentNumber: currentInstallmentNumber,
        amount: installmentAmount,
        dueDate: this.formatDate(dueDate),
        status: "pendiente",
        createdAt: new Date().toISOString(),
      });

      dueDate = this.getNextDueDate(dueDate, debt.debtTerms);
    }

    return installments;
  }
}
