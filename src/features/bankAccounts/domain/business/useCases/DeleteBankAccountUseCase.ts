
import type { Result } from "../../../../../core/helpers/ResultC";
import type { BankAccountGateway } from "../../infraestructure/BankAccountGateway";

export type DeleteBankAccountError =
    | { code: "NETWORK_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export interface DeleteBankAccountInput {
    companyId: string;
    bankAccountId: string;
}

export interface DeleteBankAccountOutput {
    success: boolean;
}

export class DeleteBankAccountUseCase {
    private gateway: BankAccountGateway;
    constructor(gateway: BankAccountGateway) {
        this.gateway = gateway;
    }

    async execute(input: DeleteBankAccountInput): Promise<Result<DeleteBankAccountOutput, DeleteBankAccountError>> {
        return await this.gateway.delete(input);
    }
}
