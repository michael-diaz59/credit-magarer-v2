export interface User {
  id:string;
  name:string
  email:string;
  companyId:string;
  roles: Role[]

  /**representa el dinero que pueda llegar a tener recolectado en fisico un cobrador */
  totalAmount?: number
}

export type Role = "ADMIN" | "OFFICE_ADVISOR" | "FIELD_ADVISOR" |"COLLECTOR" | "AUDITOR" | "ACCOUNTANT"