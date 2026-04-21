
import type { Result } from "../../../../core/helpers/ResultC";
import type { Roster } from "../business/entities/Roster";

export interface RosterGateway {
    save(companyId: string, roster: Roster): Promise<Result<void, Error>>;
    getByUserId(companyId: string, userId: string): Promise<Result<Roster | null, Error>>;
}
