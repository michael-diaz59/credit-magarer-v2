import type { Result } from "../../../../core/helpers/ResultC";
import type { User } from "../business/entities/User";
import type { getUserError, setUserError } from "../business/entities/userErrors";
import type { GetUserByCompanyInput, GetUserByCompanyOutput } from "../business/useCases/GetUsersByCompanyCase";
import type { GetUsersByRouteInput, GetUsersByRouteOutput } from "../business/useCases/GetUsersByRouteUseCase";

export interface UserGateway {
  getById(userId: string): Promise<Result<User | null, getUserError>>;
  getById2(userId: string, companyId: string): Promise<Result<User | null, getUserError>>;
  setUser(user: User): Promise<Result<void, setUserError>>;
  getUsersByCompany(input: GetUserByCompanyInput): Promise<GetUserByCompanyOutput>;
  updateCollectorRoutes(userId: string, companyId: string, routes: Record<string, string[]>): Promise<Result<void, setUserError>>
  updateTotalAmount(userId: string, companyId: string, newAmount: number): Promise<Result<void, setUserError>>;
  updateUserRoutes(userId: string, companyId: string, idRoutes: string[]): Promise<Result<void, setUserError>>;
  getUsersByRoute(input: GetUsersByRouteInput): Promise<GetUsersByRouteOutput>;
  updateUser(companyId: string, user: User): Promise<Result<void, setUserError>>;
}
