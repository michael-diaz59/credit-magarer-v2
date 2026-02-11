import { fail, ok, type Result } from "../../../../core/helpers/ResultC"
import type { AppDispatch } from "../../../../store/redux/coreRedux"
import { FirebaseUserRepository } from "../../provider/firebase/FirebaseUserRepository"
import { ReduxUser } from "../../state/ReduxUser"

import type { User } from "../business/entities/User"
import type { getUserError, setUserError } from "../business/entities/userErrors"
import { GetUserByCompanyCase, type GetUserByCompanyInput, type GetUserByCompanyOutput } from "../business/useCases/GetUsersByCompanyCase"
import { GetUserUseCase, type GetUserInput } from "../business/useCases/GetUserUseCase"
import { SetUserUseCase, type SetUserInput } from "../business/useCases/SetUserUseCase"
import { AddRouteCase, type AddRouteInput } from "../business/useCases/AddRouteCase"
import { DeleteRouteCase, type DeleteRouteInput } from "../business/useCases/DeleteRouteCase"
import { AssignCustomerToRouteCase, type AssignCustomerToRouteInput } from "../business/useCases/AssignCustomerToRouteCase"
import { UnassignCustomerFromRouteCase, type UnassignCustomerFromRouteInput } from "../business/useCases/UnassignCustomerFromRouteCase"

import type { UserGateway } from "./UserGateway"
import type { UserState } from "./userState"

export default class UserOrchestrator {

  private getUserUseCase: GetUserUseCase
  private setUserUsecase: SetUserUseCase
  private getUserByCompanyCase: GetUserByCompanyCase

  private addRouteCase: AddRouteCase
  private deleteRouteCase: DeleteRouteCase
  private assignCustomerToRouteCase: AssignCustomerToRouteCase
  private unassignCustomerFromRouteCase: UnassignCustomerFromRouteCase

  private userState: UserState

  constructor(
    dispatch: AppDispatch,
  ) {
    const repository: UserGateway = new FirebaseUserRepository()
    this.setUserUsecase = new SetUserUseCase(repository)
    this.getUserUseCase = new GetUserUseCase(repository)
    this.getUserByCompanyCase = new GetUserByCompanyCase(repository)

    this.addRouteCase = new AddRouteCase(repository)
    this.deleteRouteCase = new DeleteRouteCase(repository)
    this.assignCustomerToRouteCase = new AssignCustomerToRouteCase(repository)
    this.unassignCustomerFromRouteCase = new UnassignCustomerFromRouteCase(repository)

    this.userState = new ReduxUser(dispatch)
  }

  /**devuelve usuarios con un rol en especifico, si no se indica u rol devuelve todos los usuarios*/
  async getUsersByCompany(input: GetUserByCompanyInput): Promise<GetUserByCompanyOutput> {
    const result = this.getUserByCompanyCase.execute(input)
    return result
  }

  async setUser(setUserInput: SetUserInput): Promise<Result<void, setUserError>> {
    const user: Result<void, setUserError> = await this.setUserUsecase.execute(setUserInput)
    if (!user.ok) {
      return fail(user.error)
    }
    this.userState.setUser(setUserInput.user)
    return ok<void>(undefined)
  }

  async getUser(getUserInput: GetUserInput): Promise<Result<User | null, getUserError>> {
    const user: Result<User | null, getUserError> = await this.getUserUseCase.execute(getUserInput)
    if (!user.ok) {
      return fail(user.error)
    }
    if (user.value) {
      this.userState.setUser(user.value)
    } else {
      this.userState.clearUser()
    }
    return ok<User | null>(user.value)
  }

  // --- Route Management Methods ---

  private async refreshUser(userId: string): Promise<void> {
    await this.getUser({ id: userId })
    // getUser updates state automatically
  }

  async addRoute(input: AddRouteInput): Promise<Result<void, setUserError>> {
    const result = await this.addRouteCase.execute(input)
    if (result.ok) {
      await this.refreshUser(input.userId)
    }
    return result
  }

  async deleteRoute(input: DeleteRouteInput): Promise<Result<void, setUserError>> {
    const result = await this.deleteRouteCase.execute(input)
    if (result.ok) {
      await this.refreshUser(input.userId)
    }
    return result
  }

  async assignCustomerToRoute(input: AssignCustomerToRouteInput): Promise<Result<void, setUserError>> {
    const result = await this.assignCustomerToRouteCase.execute(input)
    if (result.ok) {
      await this.refreshUser(input.userId)
    }
    return result
  }

  async unassignCustomerFromRoute(input: UnassignCustomerFromRouteInput): Promise<Result<void, setUserError>> {
    const result = await this.unassignCustomerFromRouteCase.execute(input)
    if (result.ok) {
      await this.refreshUser(input.userId)
    }
    return result
  }
}
