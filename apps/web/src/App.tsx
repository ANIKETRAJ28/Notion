import './App.css';

import { RouterProvider } from 'react-router';

import { QueryProvider } from './app/providers/QueryProvider';
import { router } from './app/router';
import { AuthInitializer } from './features/auth/components/AuthInitializer';

function App() {
  return (
    <QueryProvider>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </QueryProvider>
  );
}

export default App;
