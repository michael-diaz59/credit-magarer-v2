import type { DisbursementStatus } from "../../entities/Disbursement";
import type DisbursementGateway from "../../../infraestructure/DisbursementGateway";
import { fail, type Result } from "../../../../../../core/helpers/ResultC";
import type { PaymentMethod } from "../../../../../debits/domain/business/entities/Payment";
import { getLocalDate } from "../../../../../../core/helpers/dates/calculateDays";

export interface CreateDisbursementInput {
    companyId: string;
    amount: number;
    method: PaymentMethod;
    bankAccountId?: string;
    idProofOfPayment?: string;
    accountantNotes: string,
    clientId: string;
    clientName: string;
    accountantId: string;
    accountantName: string;
    routeId: string;
    routeName: string;
    debtId: string;
    debtName: string;
    status?: DisbursementStatus;
    file?: File
    collectorId: string;
    collectorName: string;
}

export interface CreateDisbursementOutput {
    state: null;
}

export type CreateDisbursementError =
    | { code: "USER_NOT_FOUND" }
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" }

export class CreateDisbursementCase {
    private readonly disbursementRepository: DisbursementGateway;

    constructor(disbursementRepository: DisbursementGateway) {
        this.disbursementRepository = disbursementRepository;
    }

    async execute(input: CreateDisbursementInput): Promise<Result<CreateDisbursementOutput, CreateDisbursementError>> {
        try {
            let isValid: boolean = true;
            if (input.status === "entregado") {
                isValid = false;
            }
            const result = await this.disbursementRepository.create({
                disbursement: {
                    createdAt: getLocalDate(new Date()),
                    updatedAt: getLocalDate(new Date()),
                    clientName: input.clientName,
                    deliveredAmount: 0,
                    pendingAmount: input.amount,
                    amount: input.amount,
                    collectorId: input.collectorId,
                    collectorName: input.collectorName,
                    method: input.method,
                    bankAccountId: input.bankAccountId,
                    idProofOfPayment: input.idProofOfPayment,
                    isValidAccountant: isValid!,
                    accountantNotes: input.accountantNotes,
                    clientId: input.clientId,
                    accountantId: input.accountantId,
                    accountantName: input.accountantName,
                    routeId: input.routeId,
                    routeName: input.routeName,
                    debtId: input.debtId,
                    debtName: input.debtName,
                    id: "",
                    isValidCollector: isValid,
                    status: input.status || "entregado",

                },
                companyId: input.companyId,
                file: input.file
            });
            if (!result.ok) {
                return result;
            }
            return result;
        } catch (error) {
            return fail({ code: "NETWORK_ERROR" });
        }
    }
}