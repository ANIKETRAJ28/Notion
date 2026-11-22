import { Navigate, Outlet } from 'react-router';

import { useAuthStore } from '@/features/auth/stores/auth.store';

import { PageLoading } from '../Loading';

export function ProtectedRoute() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  if (!isInitialized) {
    return <PageLoading />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
