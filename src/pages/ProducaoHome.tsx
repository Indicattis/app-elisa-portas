import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hammer, Boxes, Package, Sparkles, CheckSquare, Truck, BarChart3, History, ClipboardCheck } from "lucide-react";
import { useOrdensCount } from "@/hooks/useOrdensCount";

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
  BarChart3
};

export default function ProducaoHome() {
  const navigate = useNavigate();
  const { user } = useProducaoAuth();
  const { data: ordensCount } = useOrdensCount();

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
    enabled: !!user?.user_id
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

  const getRouteCount = (routeKey: string) => {
    if (!ordensCount) return 0;
    switch (routeKey) {
      case "producao_solda":
        return ordensCount.solda;
      case "producao_perfiladeira":
        return ordensCount.perfiladeira;
      case "producao_separacao":
        return ordensCount.separacao;
      case "producao_qualidade":
        return ordensCount.qualidade;
      case "producao_pintura":
        return ordensCount.pintura;
      case "producao_carregamento":
        return ordensCount.carregamento;
      default:
        return 0;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Produção</h1>
          <p className="text-muted-foreground">
            Acompanhe as ordens de produção e acesse os diferentes painéis
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => navigate('/producao/meu-historico')}>
            <History className="h-4 w-4 mr-2" />
            Meu Histórico
          </Button>
        </div>
      </div>

      {/* Acesso aos Painéis */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Acesso aos Painéis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {routes
            .filter(route => !['hub_fabrica_pedidos', 'metas', 'producao_hub'].includes(route.key))
            .map(route => {
              const Icon = getIcon(route.icon);
              const count = getRouteCount(route.key);
              return (
                <Card
                  key={route.key}
                  className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group"
                  onClick={() => navigate(route.path)}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium text-sm">
                        {route.label.replace(/^Produção\s*-\s*/i, '')}
                      </span>
                    </div>
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {count}
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Seção Conferência de Estoque */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Conferência</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group"
            onClick={() => navigate('/producao/conferencia-estoque')}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-sm">Estoque da Fábrica</span>
              </div>
            </div>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group"
            onClick={() => navigate('/producao/conferencia-almox')}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Boxes className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-sm">Almoxarifado</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {routes.length === 0 && !isLoading && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-2">
              Você não tem acesso a nenhuma área de produção.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador para solicitar permissões.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
