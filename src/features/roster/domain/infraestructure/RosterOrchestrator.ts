
import { FirebaseRosterRepository } from "../../repository/FirebaseRosterRepository";
import { SaveRosterUseCase, type SaveRosterInput, type SaveRosterOutput, type SaveRosterError } from "../business/useCases/SaveRosterUseCase";
import { GetRosterByUserUseCase, type GetRosterByUserInput, type GetRosterByUserOutput, type GetRosterByUserError } from "../business/useCases/GetRosterByUserUseCase";
import type { Result } from "../../../../core/helpers/ResultC";
import type { RosterGateway } from "./RosterGateway";

export default class RosterOrchestrator {
    private saveRosterUseCase: SaveRosterUseCase;
    private getRosterByUserUseCase: GetRosterByUserUseCase;
    private rosterGateway: RosterGateway;

    constructor() {
        this.rosterGateway = new FirebaseRosterRepository();
        this.saveRosterUseCase = new SaveRosterUseCase(this.rosterGateway);
        this.getRosterByUserUseCase = new GetRosterByUserUseCase(this.rosterGateway);
    }

    async saveRoster(input: SaveRosterInput): Promise<Result<SaveRosterOutput, SaveRosterError>> {
        return this.saveRosterUseCase.execute(input);
    }

    async getRosterByUser(input: GetRosterByUserInput): Promise<Result<GetRosterByUserOutput, GetRosterByUserError>> {
        return this.getRosterByUserUseCase.execute(input);
    }
}
