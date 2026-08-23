import type { LocationGPS } from "../../../../costumers/domain/business/entities/Address";


export interface CollectionAttempt {
    id: string;
    installmentId: string;
    collectorId: string;
    routeId: string;
    debtId: string;
    customerId: string;
    companyId: string;
    auditorDescription?: string;
    colletorDescription: string;
    date: string; // ISO String
    location?: LocationGPS;
    name: string;
}
