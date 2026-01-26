import type { PersonalInfo } from "./PersonalInfo";

export const defaultPersonForm: PersonalInfo = {
  fullName: '',
  idNumber: '',
  birthCity: '',
  birthDate: '',
  issueCity: '',
  issueDate: "",

  maritalStatus: 'SOLTERO',
  childrenCount: 0,
  phone: '',

  address: {
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
