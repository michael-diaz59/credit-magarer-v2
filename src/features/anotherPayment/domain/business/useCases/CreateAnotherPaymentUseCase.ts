import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { CategoryPayment } from "../entities/AnotherPayment";
import type { PaymentMethod, PaymentStatus } from "../../../../debits/domain/business/entities/Payment";
import type AnotherPaymentGateway from "../../infraestructure/AnotherPaymentGateway";

export interface CreateAnotherPaymentInput {
    companyId: string;
    createdAt: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    bankAccountId: string;
    idProofOfPayment: string;
    observations: string;
    userId: string;
    category: CategoryPayment;
    file?: File;
}

export interface CreateAnotherPaymentOutput {
    id: string;
}

export type CreateAnotherPaymentError =
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class CreateAnotherPaymentUseCase {
    private gateway: AnotherPaymentGateway;

    constructor(gateway: AnotherPaymentGateway) {
        this.gateway = gateway;
    }

    async execute(input: CreateAnotherPaymentInput): Promise<Result<CreateAnotherPaymentOutput, CreateAnotherPaymentError>> {
        try {
            const { companyId, file, ...paymentData } = input;

            const result = await this.gateway.create(companyId, paymentData, file);

            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }

            return ok({ id: result.value });

        } catch (error) {
            console.error("Error in CreateAnotherPaymentUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
