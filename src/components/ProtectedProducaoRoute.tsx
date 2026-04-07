import { Navigate, useLocation } from "react-router-dom";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedProducaoRouteProps {
  children: React.ReactNode;
  routeKey?: string;
}

export function ProtectedProducaoRoute({ children, routeKey }: ProtectedProducaoRouteProps) {
  const { user, loading, initialized } = useProducaoAuth();
  const location = useLocation();

  // Verificação de acesso à rota específica
  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['route-access-producao', user?.user_id, routeKey],
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

  // Wait for auth to fully initialize before making any redirect decisions
  if (!initialized || loading || (routeKey && user && accessLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Não autenticado → login do producao
  if (!user) {
    return <Navigate to="/producao/login" state={{ from: location }} replace />;
  }

  // Sem permissão → forbidden do producao
  if (routeKey && !hasAccess) {
    return <Navigate to="/producao/forbidden" replace />;
  }

  return <>{children}</>;
}
