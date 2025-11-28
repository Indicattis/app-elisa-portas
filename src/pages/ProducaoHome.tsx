import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hammer, Boxes, Package, Sparkles, CheckSquare, Truck, BarChart3, Trophy, Medal, ChevronLeft, ChevronRight } from "lucide-react";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { usePontuacaoRanking } from "@/hooks/usePontuacaoRanking";

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
  BarChart3,
  Trophy,
  Medal,
};

const ITEMS_PER_PAGE = 5;

export default function ProducaoHome() {
  const navigate = useNavigate();
  const { user } = useProducaoAuth();
  const { data: ordensCount } = useOrdensCount();
  const { data: ranking = [], isLoading: loadingRanking } = usePontuacaoRanking();
  const [currentPage, setCurrentPage] = useState(1);

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

  const getRouteCount = (routeKey: string) => {
    if (!ordensCount) return 0;
    switch (routeKey) {
      case "producao_soldagem":
        return ordensCount.soldagem;
      case "producao_perfiladeira":
        return ordensCount.perfiladeira;
      case "producao_separacao":
        return ordensCount.separacao;
      case "producao_qualidade":
        return ordensCount.qualidade;
      case "producao_pintura":
        return ordensCount.pintura;
      default:
        return 0;
    }
  };

  // Paginação do ranking
  const totalPages = Math.ceil(ranking.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = ranking.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Produção</h1>
        <p className="text-muted-foreground">
          Acompanhe as ordens de produção e acesse os diferentes painéis
        </p>
      </div>

      {/* Ranking de Pontuação Fabril */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Ranking de Pontuação Fabril - Mês Atual</h2>
        </div>
        <Card className="p-4">
          {loadingRanking ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando ranking...
            </div>
          ) : ranking.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma pontuação registrada este mês
            </div>
          ) : (
            <>
              <div className="space-y-1">
                {currentItems.map((colaborador, index) => {
                  const globalIndex = startIndex + index;
                  return (
                    <div 
                      key={colaborador.user_id}
                      className={`flex items-center gap-2 p-1.5 px-2 rounded-lg transition-colors h-[35px] ${
                        globalIndex < 3 ? 'bg-accent/50' : 'hover:bg-accent/30'
                      }`}
                    >
                      <div className="flex items-center justify-center w-6">
                        {globalIndex === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                        {globalIndex === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                        {globalIndex === 2 && <Medal className="h-4 w-4 text-amber-700" />}
                        {globalIndex > 2 && <span className="text-[10px] font-medium text-muted-foreground">{globalIndex + 1}º</span>}
                      </div>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={colaborador.foto_perfil_url || undefined} />
                        <AvatarFallback className="text-[8px]">{colaborador.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[10px] truncate">{colaborador.nome}</p>
                        <p className="text-[8px] text-muted-foreground">{colaborador.total_linhas} linhas</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] font-bold h-5 px-1.5">
                        {colaborador.total_pontos.toFixed(1)} pts
                      </Badge>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-6 text-[9px] px-2"
                  >
                    <ChevronLeft className="h-3 w-3 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-[9px] text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-6 text-[9px] px-2"
                  >
                    Próximo
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Acesso aos Painéis */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Acesso aos Painéis</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {routes.map((route) => {
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
