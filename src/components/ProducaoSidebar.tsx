import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { Badge } from "./ui/badge";
import logoLight from "@/assets/logo-light.png";

interface AppRoute {
  key: string;
  path: string;
  label: string;
  icon?: string;
  sort_order: number;
  interface?: string;
}

export function ProducaoSidebar() {
  const { user, isAdmin } = useAuth();
  const { data: ordensCount } = useOrdensCount();

  // Buscar rotas da interface producao
  const { data: routes = [] } = useQuery({
    queryKey: ['producao-routes', user?.id],
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
      if (isAdmin) return routesData || [];

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

      return accessibleRoutes as AppRoute[];
    },
    enabled: !!user?.id,
  });

  const getIcon = (iconName?: string) => {
    if (!iconName) return icons.Circle;
    const IconComponent = (icons as any)[iconName];
    return IconComponent || icons.Circle;
  };
  const getCount = (routeKey: string) => {
    if (!ordensCount) return 0;
    switch (routeKey) {
      case "producao_solda":
        return ordensCount.soldagem || 0;
      case "producao_perfiladeira":
        return ordensCount.perfiladeira || 0;
      case "producao_separacao":
        return ordensCount.separacao || 0;
      case "producao_pintura":
        return ordensCount.pintura || 0;
      case "producao_qualidade":
        return ordensCount.qualidade || 0;
      default:
        return 0;
    }
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-3 border-b border-sidebar-border">
        <img src={logoLight} alt="Logo" className="h-10 w-auto mx-auto" />
        <p className="text-center text-xs text-sidebar-foreground/60 mt-1.5 font-medium">
          Interface de Produção
        </p>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {routes.map((route) => {
          const Icon = getIcon(route.icon);
          const count = getCount(route.key);

          return (
            <NavLink
              key={route.key}
              to={route.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground"
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{route.label}</span>
              </div>
              {count > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {count}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}