
import type { Result } from "../../../../core/helpers/ResultC";
import { FirebaseBankAccountRepository } from "../../provider/firebase/BankAccountRepository";
import { CreateBankAccountUseCase, type CreateBankAccountInput, type CreateBankAccountOutput, type CreateBankAccountError } from "../business/useCases/CreateBankAccountUseCase";
import { GetBankAccountsUseCase, type GetBankAccountsInput, type GetBankAccountsOutput, type GetBankAccountsError } from "../business/useCases/GetBankAccountsUseCase";
import { UpdateBankAccountUseCase, type UpdateBankAccountInput, type UpdateBankAccountOutput, type UpdateBankAccountError } from "../business/useCases/UpdateBankAccountUseCase";
import { DeleteBankAccountUseCase, type DeleteBankAccountInput, type DeleteBankAccountOutput, type DeleteBankAccountError } from "../business/useCases/DeleteBankAccountUseCase";
import type { BankAccountGateway } from "./BankAccountGateway";

export default class BankAccountOrchestrator {
    private createCase: CreateBankAccountUseCase;
    private getAllCase: GetBankAccountsUseCase;
    private updateCase: UpdateBankAccountUseCase;
    private deleteCase: DeleteBankAccountUseCase;
    private gateway: BankAccountGateway;

    constructor() {
        this.gateway = new FirebaseBankAccountRepository();
        this.createCase = new CreateBankAccountUseCase(this.gateway);
        this.getAllCase = new GetBankAccountsUseCase(this.gateway);
        this.updateCase = new UpdateBankAccountUseCase(this.gateway);
        this.deleteCase = new DeleteBankAccountUseCase(this.gateway);
    }

    async create(input: CreateBankAccountInput): Promise<Result<CreateBankAccountOutput, CreateBankAccountError>> {
        return this.createCase.execute(input);
    }

    async getAll(input: GetBankAccountsInput): Promise<Result<GetBankAccountsOutput, GetBankAccountsError>> {
        return this.getAllCase.execute(input);
    }

    async update(input: UpdateBankAccountInput): Promise<Result<UpdateBankAccountOutput, UpdateBankAccountError>> {
        return this.updateCase.execute(input);
    }

    async delete(input: DeleteBankAccountInput): Promise<Result<DeleteBankAccountOutput, DeleteBankAccountError>> {
        return this.deleteCase.execute(input);
    }
}
