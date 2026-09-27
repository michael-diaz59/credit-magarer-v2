import type { Result } from "../../../../../core/helpers/ResultC";
import type { Address } from "../../../../costumers/domain/business/entities/Address";
import type { PayCollectorGateway } from "../../infraestructure/PayCollectorGateway";
import type { CollectorPaymentStatus } from "../entities/CollectorPayment";

export type CreatePayCollectorError =
    | { code: "USER_NOT_FOUND" }
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export interface CreatePayCollectorInput {
    collectorId: string
    companyId: string
    monto: number
    routeName: string
    debtId: string
    clientId: string
    accountantId: string
    routeId: string
    collectorName: string
    collectorNotes: string
    clientName: string
    clientDocument: string
    clientPhone: string
    clientAddres: Address
    amountPaid: number
    amountPending: number
    percentageOfAmountPaid: number
    status: CollectorPaymentStatus
    createdAt: string
    updatedAt: string
    userId: string
    dateToPay: string
}

export interface CreatePayCollectorOutput {
    state: null
}

/**crear un pago que debe hacer un cobrador */
export class CreatePayCollectorCase {
    private payCollectorGateway: PayCollectorGateway

    constructor(
        userRepository: PayCollectorGateway
    ) {
        this.payCollectorGateway = userRepository
    }
    /**crear un pago que debe hacer un cobrador */
    async execute(input: CreatePayCollectorInput): Promise<Result<CreatePayCollectorOutput, CreatePayCollectorError>> {

        return await this.payCollectorGateway.createPayCollector(
            {
                payCollector: {
                    collectorId: input.collectorId,
                    id: input.companyId,
                    amount: input.monto,
                    debtId: input.debtId,
                    clientId: input.clientId,
                    accountantId: input.accountantId,
                    routeId: input.routeId,
                    collectorName: input.collectorName,
                    collectorNotes: "",
                    clientName: input.clientName,
                    clientDocument: input.clientDocument,
                    clientAddres: input.clientAddres,
                    amountPaid: 0,
                    amountPending: input.monto,
                    percentageOfAmountPaid: 0,
                    accountantNotes: "",
                    clientPhone: input.clientPhone,
                    ToPay: true,
                    dateToPay: input.dateToPay,
                    status: input.status,
                    registresDate: input.createdAt,
                    routeName: input.routeName,
                },
                companyId: input.companyId,
            }
        )
    }
}