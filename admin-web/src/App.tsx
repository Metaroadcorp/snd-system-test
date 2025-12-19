import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EldersPage from '@/pages/EldersPage';
import RidesPage from '@/pages/RidesPage';
import BroadcastsPage from '@/pages/BroadcastsPage';
import TasksPage from '@/pages/TasksPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="elders" element={<EldersPage />} />
            <Route path="rides" element={<RidesPage />} />
            <Route path="broadcasts" element={<BroadcastsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="users" element={<div className="card">직원 관리 (개발중)</div>} />
            <Route path="organizations" element={<div className="card">센터 관리 (개발중)</div>} />
            <Route path="settings" element={<div className="card">설정 (개발중)</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
