import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type Visit from "../entities/Visit";
import type { Debt } from "../../../../debits/domain/business/entities/Debt";
import type VisitGateway from "../../infraestructure/VisitGateway";
import type { DebtGateway } from "../../../../debits/domain/infraestructure/DebtGatweay";
import { CreateVisitUseCase, type CreateVisitOutput } from "./CreateVisitUseCase";
import { CreateDebtUseCase } from "../../../../debits/domain/business/useCases/debt/CreateDebtUseCase";
import type { visitErros } from "../entities/types";

export interface CreateVisitWithDebtInput {
    idCompany: string;
    idUser: string;
    visit: Visit;
    debt: Omit<Debt, "id">;
}

export class CreateVisitWithDebtUseCase {
    private createVisitUseCase: CreateVisitUseCase;
    private createDebtUseCase: CreateDebtUseCase;

    constructor(
        visitGateway: VisitGateway,
        debtGateway: DebtGateway
    ) {
        this.createVisitUseCase = new CreateVisitUseCase(visitGateway);
        this.createDebtUseCase = new CreateDebtUseCase(debtGateway);
    }

    async execute(input: CreateVisitWithDebtInput): Promise<Result<CreateVisitOutput, visitErros>> {
        // 1. Crear la visita primero
        const visitResult = await this.createVisitUseCase.execute({
            idCompany: input.idCompany,
            idUser: input.idUser,
            visit: input.visit
        });

        if (!visitResult.ok) {
            return fail(visitResult.error);
        }

        // 2. Si la visita se creó, necesitamos su ID para la deuda
        const visitId = visitResult.value.id;

        // 3. Crear la deuda asociada
        const debtInput = {
            ...input.debt,
            idVisit: visitId
        };

        const debtResult = await this.createDebtUseCase.execute({
            companyId: input.idCompany,
            debt: debtInput
        });

        if (!debtResult.ok) {
            // Nota: Aquí hay un compromiso. Si la deuda falla pero la visita se creó...
            // En una arquitectura más compleja usaríamos una transacción, 
            // pero siguiendo el patrón actual, retornamos el error de la visita si falló,
            // o notificamos éxito de visita aunque deuda fallara? 
            // Por simplicidad y consistencia, si la deuda falla devolvemos error.
            return fail({ code: "UNKNOWN_ERROR" });
        }

        return ok({ id: visitId });
    }
}
