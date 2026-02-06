import { fail, ok, type Result } from "../../../../core/helpers/ResultC"
import type { AppDispatch } from "../../../../store/redux/coreRedux"
import { FirebaseUserRepository } from "../../provider/firebase/FirebaseUserRepository"
import { ReduxUser } from "../../state/ReduxUser"

import type { User } from "../business/entities/User"
import type { getUserError, setUserError } from "../business/entities/userErrors"
import { GetUserByCompanyCase, type GetUserByCompanyInput, type GetUserByCompanyOutput } from "../business/useCases/GetUsersByCompanyCase"
import { GetUserUseCase, type GetUserInput } from "../business/useCases/GetUserUseCase"
import {SetUserUseCase, type SetUserInput } from "../business/useCases/SetUserUseCase"
import type { UserGateway } from "./UserGateway"
import type { UserState } from "./userState"

export default class UserOrchestrator {

  private getUserUseCase: GetUserUseCase
  private setUserUsecase: SetUserUseCase
  private getUserByCompanyCase:GetUserByCompanyCase

  private userState: UserState

  constructor(
    dispatch: AppDispatch,
  ) {
    const repository: UserGateway=new FirebaseUserRepository()
    this.setUserUsecase= new SetUserUseCase(repository)
    this.getUserUseCase = new GetUserUseCase(repository)
    this.getUserByCompanyCase= new GetUserByCompanyCase(repository)
    this.userState = new ReduxUser(dispatch)
  }

  /**devuelve usuarios con un rol en especifico, si no se indica u rol devuelve todos los usuarios*/
  async getUsersByCompany(input: GetUserByCompanyInput):Promise<GetUserByCompanyOutput>{
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
}
