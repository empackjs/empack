import { injectable } from "../../../../src/di";
import { TrackClassMethods } from "../../../../src/utils";
import { IUserRepository } from "../../application/persistence/user.repository";
import { UserRoot } from "../../domain/user/user.root";

const memory_db: UserRoot[] = [];

@injectable()
@TrackClassMethods()
export class UserRepository implements IUserRepository {
  async create(user: UserRoot): Promise<UserRoot> {
    memory_db.push(user);
    return user;
  }

  async getByAccount(account: string): Promise<UserRoot | null> {
    const user = memory_db.find((x) => x.account === account);
    if (!user) return null;
    return UserRoot.create({
      id: user.id,
      account: user.account,
      password: user.password,
      username: user.username,
    });
  }
}
