export interface User {
  id:string;
  name:string
  email:string;
  companyId:string;
  roles: Role[]
}

export type Role = "ADMIN" | "OFFICE_ADVISOR" | "FIELD_ADVISOR" |"COLLECTOR" | "AUDITOR" | "ACCOUNTANT"