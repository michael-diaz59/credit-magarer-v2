import type { GeoLocation } from "./Payment";

export interface CollectionAttempt {
    id: string;
    installmentId: string;
    collectorId: string;
    debtId: string;
    customerId: string;
    companyId: string;
    auditorDescription?: string;
    colletorDescription: string;
    date: string; // ISO String
    location?: GeoLocation;
    name: string;
}
