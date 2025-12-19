import type { PersonForm } from "./PersonForm";

export const defaultPersonForm: PersonForm = {
  fullName: '',
  idNumber: '',
  birthCity: '',
  birthDate: '',
  issueCity: '',

  maritalStatus: 'SOLTERO',
  childrenCount: 0,
  phone: '',

  residenceAddress: {
    address: '',
    neighborhood: '',
    stratum: 1,
    city: '',
  },

  housing: {
    type: 'FAMILIAR',
    landlordName: '',
    landlordPhone: '',
    rentValue: 0,
  },

  workInfo: {
    profession: '',
    economicSector: '',
    company: '',
    companyAddress: '',
  },
};
