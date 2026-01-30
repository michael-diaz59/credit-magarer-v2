import { fail, type Result } from "../../../../../core/helpers/ResultC"
import CustomerOrchestrator from "../../../../costumers/domain/infraestructure/CustomerOrchestrator"
import type VisitGateway from "../../infraestructure/VisitGateway"
import type { visitErros } from "../entities/types"
import type Visit from "../entities/Visit"

export interface CreateVisitInput {
    idCompany: string
    idUser: string
    visit: Visit
}

//envuele la respuesta, null indica que fue exitosa la consulta
export interface CreateVisitOutput {
    state: Result<null, visitErros>
}

export class CreateVisitUseCase {
    private gateway: VisitGateway
    private costumerOrchestrator: CustomerOrchestrator

    constructor(
        gateway: VisitGateway
    ) {
        this.gateway = gateway
        this.costumerOrchestrator = new CustomerOrchestrator()
    }


    async execute(input: CreateVisitInput): Promise<CreateVisitOutput> {
        // Implementation to get user details
        const costumerResult = await this.costumerOrchestrator.getCostumerByIdNumber({
            companyId: input.idCompany,
            documentId: input.visit.customerDocument
        })

        if (costumerResult.state.ok) {
            if (costumerResult.state.value) {
                const costumer = costumerResult.state.value;

                const visitToSave: Visit = {
                    ...input.visit,

                    id: input.visit.id ?? crypto.randomUUID(),

                    customerId: costumer.id,
                    customerDocument: costumer.applicant.idNumber,
                    customerName: costumer.applicant.fullName,
                    custumerAddres: costumer.applicant.address.address,

                    createdAt:
                        input.visit.createdAt || new Date().toISOString().slice(0, 10),
                };

                return await this.gateway.createVisit(
                    {
                        ...input,
                        visit: visitToSave,
                    }
                )
            }

        }
        return { state: fail<visitErros>({ code: "USER_NOT_FOUND" }) }


    }

}