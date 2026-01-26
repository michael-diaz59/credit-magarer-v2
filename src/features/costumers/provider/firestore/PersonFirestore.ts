import type { Timestamp } from "firebase/firestore";
import type { AddressFirestore } from "./AddressFirestore";
import type { HousingFirestore } from "./HousingFirestore";
import type { WorkInfoFirestore } from "./WorkInfoFirestore";
import type { MaritalStatus } from "../../domain/business/entities/PersonalInfo";


export interface PersonFirestore {
  fullName: string;
  idNumber: string;

  birthCity: string;
  birthDate: Timestamp;
  issueCity: string;
  issueDate: Timestamp

  maritalStatus: MaritalStatus;
  childrenCount: number;
  phone: string;

  address: AddressFirestore;
  housing: HousingFirestore;
  workInfo: WorkInfoFirestore;
}
