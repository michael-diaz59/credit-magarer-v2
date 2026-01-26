import type { AppDispatch } from "../../../store/redux/coreRedux";
import type { User } from "../domain/business/entities/User";
import type { UserState } from "../domain/infraestructure/userState";
import { clearUser, createUser, setUser } from "../slices/ReduxUserSlice";

//clase encargada de implementar la gestion del estado de autenticacion usando Redux Toolkit
export class ReduxUser implements UserState {
  private dispatch: AppDispatch
  constructor( dispatch: AppDispatch) {
    this.dispatch = dispatch
  }
    createUser(user: User): void {
        this.dispatch(createUser(user));
    }
    setUser(user: User): void {
        this.dispatch(setUser(user));
    }
    clearUser(): void {
        this.dispatch(clearUser());
    }

}