export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthWorkspace {
  id: string;
  name: string;
}

export interface AuthResponse {
  success: string;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
    workspace?: AuthWorkspace;
  };
}

export interface RefreshTokenResponse {
  success: string;
  message: string;
  data: {
    accessToken: string;
  };
}

export interface LogoutResponse {
  success: string;
  message: string;
}

export interface CurrentUserResponse {
  success: string;
  data: {
    user: AuthUser;
  };
}
