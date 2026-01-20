import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRouteAccess } from "@/hooks/useRouteAccess";

interface ProtectedRouteProps {
  children: React.ReactNode;
  routeKey?: string;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, routeKey, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const { data: hasAccess, isLoading: accessLoading } = useRouteAccess(routeKey || '');

  if (loading || (routeKey && accessLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Salvar rota pretendida no sessionStorage como fallback
    sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificação específica para páginas que requerem admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  // Verificação de acesso à rota (admin sempre tem acesso)
  if (routeKey && !isAdmin && !hasAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
