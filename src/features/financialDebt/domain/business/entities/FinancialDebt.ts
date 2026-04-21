
export interface FinancialDebt {
    id: string;
    name: string; // Stored as sequential number in DB, mapped to "financiamiento-xxx" in Repository
    amount: number;
    installmentAmount: number;
    periocidad: "mensual" | "quincenal";
    startDate: string; // YYYY-MM-DD
    idProof: string; // Filename of the proof
    createdAt: string; // YYYY-MM-DD
}
