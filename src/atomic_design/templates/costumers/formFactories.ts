import type { CostumerFormValues } from "./SchemasCostumer";

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

export const emptyPersonalInfo = (): CostumerFormValues["applicant"] => ({
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


export const emptyVehicle = (): CostumerFormValues["vehicle"][number] => ({
  vehicleClass: "",
  model: "",
  brand: "",
  commercialValue: 0,
  pledged: false,
  serviceType: "PARTICULAR",
});

export const emptyFamilyReference = (): CostumerFormValues["familyReference"][number] => ({
  fullName: "",
  phone: "",
  relationship: "",
  address:emptyAddress,
  housingType: "FAMILIAR",
  workInfo:emptyWorkInfo,
});
