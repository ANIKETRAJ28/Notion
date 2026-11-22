import { create } from 'zustand';

import type { AuthUser } from '../types/auth.types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean;

  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,

  setAuth: (user, accessToken) => {
    set({ user, accessToken });
  },

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },

  setInitialized: (isInitialized) => {
    set({ isInitialized });
  },

  clearAuth: () => {
    set({
      user: null,
      accessToken: null,
    });
  },
}));
