import type { LocationGPS } from "../../../../costumers/domain/business/entities/Address";


export default interface AttemptedCollection {
  id: string;
  idClient: string;
  idCollector: string;
  idDebt: string;
  idInstallment: string;
  idRoute: string;
  description: string;
  createAt: string;
  /** ubicación del último intento de cobro */
  locationAttemptedPayment?: LocationGPS;
  outstandingAmount: number;
  outstandingCapital: number;
  outstandingInterest: number;
  outstandingArrears: number;
  outstandingTotal: number;
}
