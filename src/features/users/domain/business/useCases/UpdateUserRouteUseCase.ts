import type { Result } from "../../../../../core/helpers/ResultC";
import type { setUserError } from "../entities/userErrors";
import type { UserGateway } from "../../infraestructure/UserGateway";

export interface UpdateUserRouteInput {
  userId: string;
  companyId: string;
  idRoutes: string[];
}

export type UpdateUserRouteOutput = void;

export class UpdateUserRouteUseCase {
  private userGateway: UserGateway;

  constructor(userGateway: UserGateway) {
    this.userGateway = userGateway;
  }

  async execute(input: UpdateUserRouteInput): Promise<Result<UpdateUserRouteOutput, setUserError>> {
    return await this.userGateway.updateUserRoutes(input.userId, input.companyId, input.idRoutes);
  }
}
