
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useHasPermission } from "@/hooks/usePermissions";
import { AppPermission } from "@/types/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePermission?: AppPermission;
}

export function ProtectedRoute({ children, requireAdmin = false, requirePermission }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  const { hasPermission, isLoading: permissionLoading } = useHasPermission(requirePermission!);

  const isLoadingPermissions = requirePermission && permissionLoading;

  if (loading || isLoadingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Verificação específica para páginas que requerem admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/forbidden" replace />;
  }

  // Verificação de permissões específicas (admin sempre tem acesso)
  if (requirePermission && !isAdmin && !hasPermission) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
