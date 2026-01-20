import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading, isAdmin } = useAuth();
  
  // Buscar primeira rota acessível
  const { data: firstRoute, isLoading: routesLoading } = useQuery({
    queryKey: ['first-accessible-route', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: routes, error } = await supabase
        .from('app_routes')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      // Admin tem acesso a todas
      if (isAdmin && routes && routes.length > 0) {
        return routes[0];
      }
      
      // Verificar acesso para cada rota até encontrar uma acessível
      for (const route of routes || []) {
        const { data: hasAccess } = await supabase.rpc('has_route_access', {
          _user_id: user.id,
          _route_key: route.key
        });
        
        if (hasAccess) {
          return route;
        }
      }
      
      return null;
    },
    enabled: !!user?.id,
  });

  if (loading || routesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirecionar para /home (hub principal)
  return <Navigate to="/home" replace />;
};

export default Index;
