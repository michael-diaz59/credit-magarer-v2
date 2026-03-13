import type { Result } from "../../../../../core/helpers/ResultC";
import type { User } from "../entities/User";
import type { getUserError } from "../entities/userErrors";
import type { UserGateway } from "../../infraestructure/UserGateway";

export interface GetUsersByRouteInput {
  routeId: string;
  companyId: string;
}

export interface GetUsersByRouteOutput {
  state: Result<User[], getUserError>;
}

export class GetUsersByRouteUseCase {
  private userGateway: UserGateway;

  constructor(userGateway: UserGateway) {
    this.userGateway = userGateway;
  }

  async execute(input: GetUsersByRouteInput): Promise<GetUsersByRouteOutput> {
    return await this.userGateway.getUsersByRoute(input);
  }
}
