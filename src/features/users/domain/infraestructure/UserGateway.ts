import type { Result } from "../../../../core/helpers/ResultC";
import type { User } from "../business/entities/User";
import type { getUserError, setUserError } from "../business/entities/userErrors";
import type { GetUserByCompanyInput, GetUserByCompanyOutput } from "../business/useCases/GetUsersByCompanyCase";

export interface UserGateway {
  getById(userId: string):Promise<Result<User | null, getUserError>>;
  setUser(user:User):Promise<Result<void,setUserError>>;
  getUsersByCompany(input: GetUserByCompanyInput): Promise<GetUserByCompanyOutput>
}
