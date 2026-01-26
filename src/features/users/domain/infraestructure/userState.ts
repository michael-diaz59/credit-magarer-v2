import type { User } from "../business/entities/User";

export interface UserState {
    createUser(user: User): void;
    setUser(user: User): void;
    clearUser(): void;
}
