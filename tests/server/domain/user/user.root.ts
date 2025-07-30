type UserProps = {
  id: string;
  account: string;
  password: string;
  username: string;
};

export class UserRoot implements UserProps {
  id: string;
  account: string;
  password: string;
  username: string;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.account = props.account;
    this.password = props.password;
    this.username = props.username;
  }

  static create(props: UserProps): UserRoot {
    return new UserRoot(props);
  }

  async isPasswordCorrect(password: string): Promise<boolean> {
    return password === this.password;
  }
}
