import { Navigate, useLocation } from "react-router-dom";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedProducaoRouteProps {
  children: React.ReactNode;
  routeKey?: string;
}

export function ProtectedProducaoRoute({ children, routeKey }: ProtectedProducaoRouteProps) {
  const { user, loading, initialized, hasSession } = useProducaoAuth();
  const location = useLocation();

  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['route-access-producao', user?.user_id, routeKey],
    retry: false,
    queryFn: async () => {
      if (!user?.user_id || !routeKey) return true;

      const { data, error } = await supabase.rpc('has_route_access' as any, {
        _user_id: user.user_id,
        _route_key: routeKey
      });

      if (error) {
        console.error('Erro ao verificar acesso:', error);
        return false;
      }
      return data || false;
    },
    enabled: !!user?.user_id && !!routeKey,
    staleTime: 5 * 60 * 1000,
  });

  // Wait for auth to fully initialize
  if (!initialized || loading || (routeKey && user && accessLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only redirect to login if there's truly no session (not just missing profile)
  if (!hasSession && !user) {
    return <Navigate to="/producao/login" state={{ from: location }} replace />;
  }

  // Has session but no profile found - show forbidden instead of login loop
  if (hasSession && !user) {
    return <Navigate to="/producao/forbidden" replace />;
  }

  // No permission for this route
  if (routeKey && !hasAccess) {
    return <Navigate to="/producao/forbidden" replace />;
  }

  return <>{children}</>;
}
