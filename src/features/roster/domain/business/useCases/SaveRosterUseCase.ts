
import { fail, ok, type Result } from "../../../../../core/helpers/ResultC";
import type { RosterGateway } from "../../infraestructure/RosterGateway";
import type { Roster } from "../entities/Roster";

export interface SaveRosterInput {
    companyId: string;
    roster: Roster;
}

export interface SaveRosterOutput {
    success: boolean;
}

export type SaveRosterError = 
    | { code: "PERSISTENCE_ERROR" }
    | { code: "UNKNOWN_ERROR" };

export class SaveRosterUseCase {
    private rosterGateway: RosterGateway;
    constructor(rosterGateway: RosterGateway) {
        this.rosterGateway = rosterGateway;
    }

    async execute(input: SaveRosterInput): Promise<Result<SaveRosterOutput, SaveRosterError>> {
        try {
            const result = await this.rosterGateway.save(input.companyId, input.roster);
            if (!result.ok) {
                return fail({ code: "PERSISTENCE_ERROR" });
            }
            return ok({ success: true });
        } catch (error) {
            console.error("Error in SaveRosterUseCase:", error);
            return fail({ code: "UNKNOWN_ERROR" });
        }
    }
}
