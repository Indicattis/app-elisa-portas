import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { AppPermission } from "@/types/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

interface ProtectedRouteWithPermissionProps {
  children: ReactNode;
  permission: AppPermission;
  fallback?: ReactNode;
}

export function ProtectedRouteWithPermission({ 
  children, 
  permission, 
  fallback 
}: ProtectedRouteWithPermissionProps) {
  const { user, isAdmin } = useAuth();
  const { hasPermission, loading } = useUserPermissions();

  if (!user) {
    return null;
  }

  // Mostrar loading enquanto as permissões estão sendo carregadas
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAdmin || hasPermission(permission)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Settings className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground text-center">
            Você não tem permissão para acessar esta página.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}