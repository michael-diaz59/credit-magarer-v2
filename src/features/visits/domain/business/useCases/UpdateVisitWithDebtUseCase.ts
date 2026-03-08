import { ok, type Result } from "../../../../../core/helpers/ResultC";
import type Visit from "../entities/Visit";
import type { Debt } from "../../../../debits/domain/business/entities/Debt";
import type VisitGateway from "../../infraestructure/VisitGateway";
import type { DebtGateway, InstallmentGateway } from "../../../../debits/domain/infraestructure/DebtGatweay";
import EditVisitCase from "./EditVisitCase";
import { UpdateDebtUseCase } from "../../../../debits/domain/business/useCases/debt/UpdateDebtUseCase";
import type { visitErros } from "../entities/types";
import type CostumerGateway from "../../../../costumers/domain/infraestructure/CostumerGateway";

export interface UpdateVisitWithDebtInput {
    idCompany: string;
    idUser: string;
    visit: Visit;
    debt: Debt;
}

export class UpdateVisitWithDebtUseCase {
    private editVisitCase: EditVisitCase;
    private updateDebtUseCase: UpdateDebtUseCase;

    constructor(
        visitGateway: VisitGateway,
        debtGateway: DebtGateway,
        installmentGateway: InstallmentGateway,
        costumerGateway: CostumerGateway
    ) {
        this.editVisitCase = new EditVisitCase(visitGateway);
        this.updateDebtUseCase = new UpdateDebtUseCase(debtGateway, installmentGateway, costumerGateway);
    }

    async execute(input: UpdateVisitWithDebtInput): Promise<Result<null, visitErros | any>> {
        // 1. Actualizar la visita
        const visitResult = await this.editVisitCase.execute({
            idCompany: input.idCompany,
            idUser: input.idUser,
            visit: input.visit
        });

        if (!visitResult.state.ok) {
            return visitResult.state;
        }

        // 2. Actualizar la deuda
        const debtResult = await this.updateDebtUseCase.execute({
            companyId: input.idCompany,
            debt: input.debt,
            isNewCollector: false // Por defecto false, se podría exponer en el input si fuera necesario
        });

        if (!debtResult.state.ok) {
            return debtResult.state;
        }

        return ok(null);
    }
}
