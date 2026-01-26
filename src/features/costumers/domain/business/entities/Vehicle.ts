
export interface Vehicle {
  vehicleClass: string;
  model: string;
  brand: string;
  commercialValue: number;
  //pignorado
  pledged: boolean;
  serviceType: VehicleServiceType;
}

export type VehicleServiceType =
  | 'PUBLICO'
  | 'PARTICULAR';
