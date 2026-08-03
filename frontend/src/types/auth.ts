export interface AuthSession {
  userId: string;
  displayName: string;
  email: string;
  roles: string[];
  hasPassword?: boolean;
  linkedProviders?: string[] | null;
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

export interface AccountLifecycleResult {
  message: string;
}
