import type { PersonalInfo } from "./PersonalInfo";
import type { FamilyReference } from "./FamilyReference";
import type { Vehicle } from "./Vehicle";

//CLASE COSTUNMER
export interface Costumer {
  id:string
  //numero de deudas del costumer
  debtCounter: number

  //observaciones textuales que puede tener un cliente
  observations:string 
  applicant: PersonalInfo
  coSigner?: PersonalInfo[];

  vehicle?: Vehicle[];
  familyReference?: FamilyReference[];
}
