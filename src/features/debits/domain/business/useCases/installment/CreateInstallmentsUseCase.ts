import type { Result } from "../../../../../../core/helpers/ResultC"
import type { Customer } from "../../../../../costumers/domain/business/entities/Customer"
import type { PersonalInfo } from "../../../../../costumers/domain/business/entities/PersonalInfo"
import type { InstallmentGateway } from "../../../infraestructure/DebtGatweay"
import type { Debt, DebtTerms } from "../../entities/Debt"
import type { Installment, InstallmentAddress } from "../../entities/Installment"


export type CreateInstallmentsError =
    | { code: "UNKNOWN_ERROR" }
    | { code: "NETWORK_ERROR" }


export interface CreateInstallmentsInput {
    debtId: string
    debt: Debt
    costumer: Customer
    companyId: string

}

export interface CreateInstallmentsOutput {
    state: Result<null, CreateInstallmentsError>
}

export interface CreateInstallmentsGatewayInput {
    debtId: string
    input: Omit<Installment, "id">[]
    companyId: string
}



/**crea un conjunto de installments para un debt recien creado*/
export class CreateInstallmentsUseCase {
    private installmentGateway: InstallmentGateway
    constructor(
        installmentGateway: InstallmentGateway,
    ) {
        this.installmentGateway = installmentGateway
    }
    /**crea un conjunto de installments para un debt recien creado*/
    async execute(
        input: CreateInstallmentsInput
    ): Promise<CreateInstallmentsOutput> {
        try {
            const { debt, costumer, companyId } = input;

            // 1️⃣ Mapear datos del costumer
            const costumerInstallmentData = this.mapCostumerToInstallmentData({
                costumerId: costumer.id,
                personalInfo: costumer.applicant,
            });

            // 2️⃣ Generar installments desde la deuda
            const installments: Omit<Installment, "id">[] = this.generateInstallmentsFromDebt(
                debt,
                costumerInstallmentData.costumerAddres
            ).map(installment => ({
                ...installment,
                costumerId: costumerInstallmentData.costumerId,
                costumerDocument: costumerInstallmentData.costumerDocument,
                costumerName: costumerInstallmentData.costumerName,
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

    mapCostumerToInstallmentData(
        input: {
            costumerId: string;
            personalInfo: PersonalInfo;
        }
    ): Pick<
        Installment,
        "costumerId" | "costumerDocument" | "costumerName" | "costumerAddres"
    > {
        const { costumerId, personalInfo } = input;

        return {
            costumerId,
            costumerDocument: personalInfo.idNumber,
            costumerName: personalInfo.fullName,
            costumerAddres: {
                address: personalInfo.address.address,
                neighborhood: personalInfo.address.neighborhood,
                stratum: personalInfo.address.stratum,
                city: personalInfo.address.city,
            },
        };
    }

    getNextDueDate(
        date: Date,
        term: DebtTerms
    ): Date {
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
        costumerAddress: InstallmentAddress
    ): Omit<Installment, "id">[] {

        const totalWithInterest =
            debt.totalAmount * (1 + debt.interestRate / 100);

        const installmentAmount =
            Number((totalWithInterest / debt.installmentCount).toFixed(2));

        const installments: Omit<Installment, "id">[] = [];

        let dueDate = new Date(debt.firstDueDate);

        for (let i = 1; i <= debt.installmentCount; i++) {
            installments.push({
                debtId: debt.id,
                interestRate: debt.interestRate,
                collectorId: debt.collectorId,
                costumerId: debt.clientId,
                costumerDocument: debt.costumerDocument,
                costumerName: debt.costumerName,
                costumerAddres: costumerAddress,
                installmentNumber: i,
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
