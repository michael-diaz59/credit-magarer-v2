
import { ok, type Result } from "../../../../../core/helpers/ResultC";
import type { RosterGateway } from "../../infraestructure/RosterGateway";
import type { Roster } from "../entities/Roster";

export interface GetRosterByUserInput {
    companyId: string;
    userId: string;
}

export interface GetRosterByUserOutput {
    roster: Roster | null;
}

export type GetRosterByUserError = 
    | { code: "UNKNOWN_ERROR" };

export class GetRosterByUserUseCase {
    private rosterGateway: RosterGateway;
    constructor(rosterGateway: RosterGateway) {
        this.rosterGateway = rosterGateway;
    }

    async execute(input: GetRosterByUserInput): Promise<Result<GetRosterByUserOutput, GetRosterByUserError>> {
        try {
            const result = await this.rosterGateway.getByUserId(input.companyId, input.userId);
            if (!result.ok) {
                return ok({ roster: null });
            }
            return ok({ roster: result.value });
        } catch (error) {
            console.error("Error in GetRosterByUserUseCase:", error);
            const result: Result<GetRosterByUserOutput, GetRosterByUserError> = {
                ok: false,
                error: { code: "UNKNOWN_ERROR" }
            };
            return result as Result<GetRosterByUserOutput, GetRosterByUserError>;
        }
    }
}
