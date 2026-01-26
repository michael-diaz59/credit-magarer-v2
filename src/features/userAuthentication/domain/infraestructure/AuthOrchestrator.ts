import { fail, ok, type Result } from "../../../../core/helpers/ResultC"
import type { AppDispatch } from "../../../../store/redux/coreRedux"
import type { User } from "../../../users/domain/business/entities/User"
import type { getUserError } from "../../../users/domain/business/entities/userErrors"
import { GetUserUseCase, type GetUserInput } from "../../../users/domain/business/useCases/GetUserUseCase"
import type { UserState } from "../../../users/domain/infraestructure/userState"
import { FirebaseUserRepository } from "../../../users/provider/firebase/FirebaseUserRepository"
import { ReduxUser } from "../../../users/state/ReduxUser"
import { FirebaseAuthRepository } from "../../repository/firebase/FirebaseAuthRepository"
import { ReduxAuthSlice } from "../../slices/authSliceFirebase"
import type { LoginError } from "../business/entities/AuthErrors"
import type { UserAuthentication } from "../business/entities/UserAuthentication"
import { LoginUseCase, type LoginInput, type LoginOutput } from "../business/useCases/LoginUseCase"
import type { AuthGateway } from "./AuthenticationGateway"
import type { AuthState } from "./AuthState"

export default class AuthOrchestrator {

  private loginUseCase:LoginUseCase
  private getUserUseCase:GetUserUseCase
  private authState:AuthState
  private userState:UserState

  constructor(
    dispatch: AppDispatch,
  ) {
    const firebaseAuthRepository:AuthGateway= new FirebaseAuthRepository()
    this.loginUseCase=new LoginUseCase(firebaseAuthRepository)
    this.getUserUseCase=new GetUserUseCase(new FirebaseUserRepository())
    this.authState= new ReduxAuthSlice(dispatch)
    this.userState= new  ReduxUser(dispatch)
  }

  async login(
    loginInput: LoginInput,
  ): Promise<Result<LoginOutput, unknown>> {

     console.log("login")
    // 1️⃣ Ejecutar login
    const loginResult:Result<LoginOutput, LoginError> = await this.loginUseCase.execute(loginInput)


    if (!loginResult.ok) {
      return fail(loginResult.error)
    }

    console.log("user id:"+loginResult.value.userId)

    const userId:GetUserInput ={ id:loginResult.value.userId}
    const authUser: UserAuthentication= {
      id: loginResult.value.userId
    }
    //this.dispatch(setAuthUser(authUser))
    this.authState.setAuthenticatedUser(authUser)

    // 2️⃣ despues de un login correcto obtiene la informacion de usuario y la carga al estado de la app
    const userResult: Result<User | null, getUserError> = await this.getUserUseCase.execute(userId)

    console.log("userResult:"+userResult.ok)
   
    if (!userResult.ok || !userResult.value) {
         console.log("USER_NOT_REGISTERED")
            return fail({ code: "USER_NOT_REGISTERED" })
        }

        const user:User = userResult.value

    // 3️⃣ Actualizar Redux / estado de UI
    this.userState.setUser(user)
     console.log("email user:"+user.email)

    // 4️⃣ Retornar resultado limpio
    const output:LoginOutput={
      userId: loginResult.value.userId
    }
    return ok(output)
  }
}
