
import { doc, getDoc, setDoc, type DocumentData } from "firebase/firestore";
import { firestore } from "../../../store/firebase/firebase";
import { ok, fail, type Result } from "../../../core/helpers/ResultC";
import type { Roster } from "../domain/business/entities/Roster";
import type { RosterGateway } from "../domain/infraestructure/RosterGateway";
import { encodeDate, decodeDate } from "../../../core/shared/firebase/codeDecodeTime";
import { removeUndefined } from "../../../core/helpers/cleanFirestoreData";

export class FirebaseRosterRepository implements RosterGateway {

    private rosterToFirestore(roster: Omit<Roster, "id">): DocumentData {
        const result: any = { ...roster };
        if (roster.startDate) result.startDate = encodeDate(roster.startDate);
        return removeUndefined(result);
    }

    private documentToRoster(id: string, data: DocumentData): Roster {
        return {
            id: id,
            userId: data.userId ?? id,
            companyId: data.companyId ?? "",
            periodicity: data.periodicity ?? "mensual",
            startDate: data.startDate ? decodeDate(data.startDate).slice(0, 10) : "",
            salary: data.salary ?? 0,
        };
    }

    async save(companyId: string, roster: Roster): Promise<Result<void, Error>> {
        try {
            // Using userId as rosterId as requested
            const refDoc = doc(firestore, "companies", companyId, "roster", roster.userId);
            const { id, ...data } = roster;
            await setDoc(refDoc, this.rosterToFirestore(data), { merge: true });
            return ok(undefined);
        } catch (error) {
            console.error("Error saving roster:", error);
            return fail(error as Error);
        }
    }

    async getByUserId(companyId: string, userId: string): Promise<Result<Roster | null, Error>> {
        try {
            const refDoc = doc(firestore, "companies", companyId, "roster", userId);
            const snap = await getDoc(refDoc);
            if (!snap.exists()) return ok(null);
            return ok(this.documentToRoster(snap.id, snap.data()));
        } catch (error) {
            console.error("Error getting roster by userId:", error);
            return fail(error as Error);
        }
    }
}
