import type { PersonalInfo } from "./PersonalInfo";
import type { FamilyReference } from "./FamilyReference";
import type { Vehicle } from "./Vehicle";

//CLASE COSTUNMER
export interface Customer {
  id: string
  /**numero de deudas del costumer */
  debtCounter: number


  calification:Calification

  photoHouseUrl?: string
  identificacionUrl?: string
  laboralUrl?: string
  documentUrl?: string

  /**el id de la lista de clientes usado para identificar rapidamente la lista y actualizar el nombre del clinte en al lista con facilidad */
  listId: string

  /**observaciones textuales que puede tener un cliente*/
  observations: string
  applicant: PersonalInfo
  coSigner?: PersonalInfo[];

  vehicle?: Vehicle[];
  familyReference?: FamilyReference[];
}

export const calificationValues = ["1", "2", "3", "4", "5"] as const;

export type Calification =
  typeof calificationValues[number];



