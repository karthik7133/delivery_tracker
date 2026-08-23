import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RoleRoute({ role }: { role: UserRole }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) {
    const redirectMap: Record<UserRole, string> = {
      CUSTOMER: '/customer',
      AGENT: '/agent',
      ADMIN: '/admin',
    };
    return <Navigate to={redirectMap[user.role]} replace />;
  }
  return <Outlet />;
}
