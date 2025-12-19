import type { VehicleServiceType } from "./utilities";


export interface VehicleForm {
  vehicleClass: string;
  model: string;
  brand: string;
  commercialValue: number;
  pledged: boolean;
  serviceType: VehicleServiceType;
}
