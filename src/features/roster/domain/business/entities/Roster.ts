
export interface Roster {
    id: string; // This will be the userId
    userId: string;
    companyId: string;
    periodicity: "mensual" | "quincenal";
    startDate: string; // YYYY-MM-DD
    salary: number;
}
