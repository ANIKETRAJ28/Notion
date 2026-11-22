import { createBrowserRouter } from 'react-router';

import { GuestRoute } from '@/components/shared/GuestRoute';
import { AppLayout } from '@/components/shared/Layout';
import { NotFoundPage } from '@/components/shared/NotFoundPage';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/Login';
import { RegisterPage } from '@/features/auth/pages/Register';
import { PageDetailPage } from '@/features/pages/pages/PageDetail';
import { WorkspacePage } from '@/features/workspaces/pages/Workspace';

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <WorkspacePage /> },
          { path: '/pages/:pageId', element: <PageDetailPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
