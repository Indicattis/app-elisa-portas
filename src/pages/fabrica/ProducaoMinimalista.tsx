import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Hammer, Boxes, Package, Sparkles, CheckSquare, Truck, History } from "lucide-react";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { MinimalistLayout } from "@/components/MinimalistLayout";

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

export default function ProducaoMinimalista() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: ordensCount } = useOrdensCount();

  // Buscar rotas da interface producao que o usuário tem acesso
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['producao-routes-minimalista', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
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
          _user_id: user.id,
          _route_key: route.key
        });
        if (hasAccess) {
          accessibleRoutes.push(route);
        }
      }
      return accessibleRoutes as ProducaoRoute[];
    },
    enabled: !!user?.id
  });

  const getIcon = (iconName?: string) => {
    if (!iconName) return Hammer;
    return iconMap[iconName] || Hammer;
  };

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

  const headerActions = (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={() => navigate('/fabrica/producao/meu-historico')} 
      className="text-white/70 hover:text-white hover:bg-white/10"
    >
      <History className="h-4 w-4 mr-2" />
      Meu Histórico
    </Button>
  );

  if (isLoading) {
    return (
      <MinimalistLayout title="Produção" backPath="/fabrica">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </MinimalistLayout>
    );
  }

  // Filtrar rotas - remover hub_fabrica_pedidos, metas, e controle_producao
  const filteredRoutes = routes.filter(
    route => !['hub_fabrica_pedidos', 'metas', 'controle_producao'].includes(route.key)
  );

  return (
    <MinimalistLayout 
      title="Produção" 
      subtitle="Acesse os painéis de produção"
      backPath="/fabrica"
      headerActions={headerActions}
    >
      {/* Grid de Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredRoutes.map(route => {
          const Icon = getIcon(route.icon);
          const count = getRouteCount(route.key);
          
          return (
            <div
              key={route.key}
              onClick={() => {
                // Mapear paths da tabela para paths minimalistas
                const minimalPath = route.path.replace('/hub-fabrica/producao/', '/fabrica/producao/');
                navigate(minimalPath);
              }}
              className="group cursor-pointer rounded-xl p-5
                         bg-white/5 border border-white/10
                         backdrop-blur-xl
                         hover:bg-white/10 hover:border-blue-500/30
                         transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 
                                  shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40
                                  transition-shadow duration-300">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-white/90">
                    {route.label.replace(/^Produção\s*-\s*/i, '')}
                  </span>
                </div>
                {count > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">
                    {count}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoutes.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center
                        bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl">
          <p className="text-white/60 mb-2">
            Você não tem acesso a nenhuma área de produção.
          </p>
          <p className="text-sm text-white/40">
            Entre em contato com o administrador para solicitar permissões.
          </p>
        </div>
      )}
    </MinimalistLayout>
  );
}
