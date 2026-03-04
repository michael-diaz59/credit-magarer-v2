import type {z} from "zod";
import type { baseCostumerSchema } from "./SchemasCostumer";
export type BaseCostumerFormValues = z.infer<typeof baseCostumerSchema>;

const emptyAddress= {
    address: "",
    neighborhood: "",
    stratum: 1,
    city: "",
  }

const emptyWorkInfo={
    profession: "",
    economicSector: "",
    company: "",
    companyAddress: "",
  }

export const emptyPersonalInfo = ():BaseCostumerFormValues["applicant"]  => ({
  fullName: "",
  idNumber: "",
  birthCity: "",
  birthDate: "",
  issueCity: "",
  issueDate: "",
  maritalStatus: "SOLTERO",
  childrenCount: 0,
  phone: "",
  address: {
    address: "",
    neighborhood: "",
    stratum: 1,
    city: "",
  },
  housing: {
    type: "FAMILIAR",
    landlordName: "",
    landlordPhone: "",
    rentValue: 0,
  },
  workInfo: {
    profession: "",
    economicSector: "",
    company: "",
    companyAddress: "",
  },
});

export const emptyPersonalInfoC = (): BaseCostumerFormValues["applicant"] => ({
  fullName: "",
  idNumber: "",
  birthCity: "",
  birthDate: "",
  issueCity: "",
  issueDate:"",
  maritalStatus: "SOLTERO",
  childrenCount: 0,
  phone: "",
  address: emptyAddress,
  housing: {
    type: "FAMILIAR",
    landlordName: "",
    landlordPhone: "",
    rentValue: 0,
  },
  workInfo:emptyWorkInfo,
});


export const emptyVehicle = (): 
  BaseCostumerFormValues["vehicle"][number] => ({
  vehicleClass: "",
  model: "",
  brand: "",
  commercialValue: 0,
  pledged: false,
  serviceType: "PARTICULAR",
});

export const emptyFamilyReference = (): 
  BaseCostumerFormValues["familyReference"][number] => ({
  fullName: "",
  phone: "",
  relationship: "",
  address: emptyAddress,
  housingType: "FAMILIAR",
  workInfo: emptyWorkInfo,
});
