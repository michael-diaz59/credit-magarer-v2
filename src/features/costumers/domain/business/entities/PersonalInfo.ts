import type { Address } from "./Address";
import type { HousingInfo } from "./HousingInfo";
import type { WorkInfo } from "./WorkInfo";


export interface PersonalInfo {

  idDocument?: string;

  idJobReference?: string;

  idPago?: string;

  /**nombre completo */
  fullName: string;

  /**cedula */
  idNumber: string;

  /**ciudad de nacimiento */
  birthCity: string;

  /**fecha de nacimiento */
  birthDate: string; // yyyy-mm-dd

  /**ciudad de expedicion de documnento */
  issueCity: string;

  /**fecha de expedicion de documnento  yyyy-mm-dd */
  issueDate: string

  /**estado civil */
  maritalStatus: MaritalStatus;
  /**numero de hijos */
  childrenCount: number;
  /**celular */
  phone: string;

  /**direccion */
  address: Address;

  /**tipo de vivienda e informacion de arrendatario */
  housing: HousingInfo;

  /**informacion de trabajo */
  workInfo: WorkInfo;
}

export type MaritalStatus =
  | 'SOLTERO'
  | 'CASADO'
  | 'UNION_LIBRE'
  | 'DIVORCIADO'
  | 'VIUDO';
