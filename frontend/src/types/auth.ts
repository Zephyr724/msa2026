export interface AuthSession {
  userId: string;
  displayName: string;
  email: string;
  roles: string[];
}

export interface RegisterInput {
  email: string;
  password: string;
  passwordConfirmation: string;
  displayName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
