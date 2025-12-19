export interface User {
  id:string;
  email:string;
  companyId:string;
  role:string
  status:UserStatus
}

export const UserStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  PENDING: "PENDING"
} as const;

export type UserStatus = typeof UserStatus[keyof typeof UserStatus];