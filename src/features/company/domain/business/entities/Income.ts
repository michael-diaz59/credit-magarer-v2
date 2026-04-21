
export interface Income {
    id: string;
    name: string; // Internal name or movement title
    idProof: string;
    investorName: string;
    date: string;
    description: string;
    amount: number;
    entryType: "efectivo" | "consignacion" | "otro";
    bankAccountId?: string;
    createdAt: string;
}
