import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer, Boxes, Package, Sparkles, CheckSquare, Truck } from "lucide-react";

interface ProducaoRoute {
  key: string;
  path: string;
  label: string;
  icon?: string;
  description?: string;
  sort_order: number;
}

const iconMap: Record<string, any> = {
  Hammer,
  Boxes,
  Package,
  Sparkles,
  CheckSquare,
  Truck,
};

export default function ProducaoHome() {
  const navigate = useNavigate();
  const { user } = useProducaoAuth();

  // Buscar rotas da interface producao que o usuário tem acesso
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['producao-routes', user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) return [];
      
      const { data: routesData, error } = await supabase
        .from('app_routes')
        .select('*')
        .eq('active', true)
        .eq('interface', 'producao')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Verificar acesso para cada rota
      const accessibleRoutes = [];
      for (const route of routesData || []) {
        const { data: hasAccess } = await supabase.rpc('has_route_access', {
          _user_id: user.user_id,
          _route_key: route.key
        });
        
        if (hasAccess) {
          accessibleRoutes.push(route);
        }
      }

      return accessibleRoutes as ProducaoRoute[];
    },
    enabled: !!user?.user_id,
  });

  const getIcon = (iconName?: string) => {
    if (!iconName) return Hammer;
    return iconMap[iconName] || Hammer;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Produção</h1>
        <p className="text-muted-foreground">
          Selecione uma das áreas disponíveis para acessar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route) => {
          const Icon = getIcon(route.icon);
          
          return (
            <Card
              key={route.key}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 hover:border-primary"
              onClick={() => navigate(route.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{route.label}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              {route.description && (
                <CardContent>
                  <CardDescription>{route.description}</CardDescription>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {routes.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-2">
              Você não tem acesso a nenhuma área de produção.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador para solicitar permissões.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
