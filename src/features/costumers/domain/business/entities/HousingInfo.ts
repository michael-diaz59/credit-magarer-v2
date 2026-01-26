export interface HousingInfo {
  type: HousingType;

  landlordName: string;
  landlordPhone: string;
  rentValue: number;
}
export type HousingType =
  | 'FAMILIAR'
  | 'PROPIA'
  | 'ALQUILADA';
