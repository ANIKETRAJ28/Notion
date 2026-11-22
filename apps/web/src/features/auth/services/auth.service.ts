import { apiRequest } from '@/lib/api-client';

import type {
  AuthResponse,
  CurrentUserResponse,
  LoginCredentials,
  LogoutResponse,
  RefreshTokenResponse,
  RegisterCredentials,
} from '../types/auth.types';

export const authService = {
  async register(credentials: RegisterCredentials) {
    return apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async login(credentials: LoginCredentials) {
    return apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async refreshToken() {
    return apiRequest<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
    });
  },

  async logout() {
    return apiRequest<LogoutResponse>('/auth/logout', {
      method: 'GET',
    });
  },

  async getCurrentUser(accessToken: string) {
    return apiRequest<CurrentUserResponse>('/auth/me', {
      method: 'GET',
      accessToken,
    });
  },
};
