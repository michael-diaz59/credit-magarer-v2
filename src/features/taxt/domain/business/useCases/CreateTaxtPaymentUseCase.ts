import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { PaymentMethod, PaymentStatus } from "../../../../debits/domain/business/entities/Payment";
import type TaxtGateway from "../../infraestructure/TaxtGateway";

export interface CreateTaxtPaymentInput {
    companyId: string;
    createdAt: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    bankAccountId: string;
    idProofOfPayment: string;
    observations: string;
    userId: string;
    file?: File;
}

export interface CreateTaxtPaymentOutput {
    id: string;
}

export type CreateTaxtPaymentError = 
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class CreateTaxtPaymentUseCase {
    private gateway: TaxtGateway;

    constructor(gateway: TaxtGateway) {
        this.gateway = gateway;
    }

    async execute(input: CreateTaxtPaymentInput): Promise<Result<CreateTaxtPaymentOutput, CreateTaxtPaymentError>> {
        try {
            const { companyId, file, ...paymentData } = input;
            
            const result = await this.gateway.create(companyId, paymentData, file);

            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            return ok({ id: result.value });

        } catch (error) {
            console.error("Error in CreateTaxtPaymentUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
