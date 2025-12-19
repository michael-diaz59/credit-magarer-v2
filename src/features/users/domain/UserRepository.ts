import type { User } from "./user";

export interface UserRepository {
  getById(userId: string): Promise<User | null>
}
