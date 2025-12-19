import type { Timestamp } from "firebase/firestore";
import type { AddressFirestore } from "./AddressFirestore";
import type { HousingFirestore } from "./HousingFirestore";
import type { MaritalStatus } from "../../domain/utilities";
import type { WorkInfoFirestore } from "./WorkInfoFirestore";


export interface PersonFirestore {
  fullName: string;
  idNumber: string;

  birthCity: string;
  birthDate: Timestamp;
  issueCity: string;

  maritalStatus: MaritalStatus;
  childrenCount: number;
  phone: string;

  residenceAddress: AddressFirestore;
  housing: HousingFirestore;
  workInfo: WorkInfoFirestore;
}
