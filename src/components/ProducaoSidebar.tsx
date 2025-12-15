import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as icons from "lucide-react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import logoLight from "@/assets/logo-light.png";
import { useState, useMemo } from "react";

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
  const [searchTerm, setSearchTerm] = useState("");

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
        return ordensCount.solda || 0;
      case "producao_perfiladeira":
        return ordensCount.perfiladeira || 0;
      case "producao_separacao":
        return ordensCount.separacao || 0;
      case "producao_pintura":
        return ordensCount.pintura || 0;
      case "producao_qualidade":
        return ordensCount.qualidade || 0;
      case "producao_carregamento":
        return ordensCount.carregamento || 0;
      default:
        return 0;
    }
  };

  // Normalizar texto para busca
  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar rotas
  const filteredRoutes = useMemo(() => {
    if (!searchTerm.trim()) return routes;
    const normalizedTerm = normalizeText(searchTerm);
    return routes.filter(route => normalizeText(route.label).includes(normalizedTerm));
  }, [routes, searchTerm]);

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-3 border-b border-sidebar-border space-y-2">
        <div className="flex items-center gap-2">
          <img src={logoLight} alt="Logo" className="h-8 w-auto" />
          <p className="text-xs text-sidebar-foreground/60 font-medium">
            Interface de Produção
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-7 pr-7 text-xs bg-sidebar-accent/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5">
        {filteredRoutes.map((route) => {
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