import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";

interface AppRoute {
  key: string;
  path: string;
  label: string;
  icon?: string;
  sort_order: number;
  interface?: string;
}

export function PaineisSidebar() {
  const { user, isAdmin } = useAuth();

  // Buscar rotas da interface paineis
  const { data: routes = [] } = useQuery({
    queryKey: ['paineis-routes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: routesData, error } = await supabase
        .from('app_routes')
        .select('*')
        .eq('active', true)
        .eq('interface', 'paineis')
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
    if (!iconName) return icons.LayoutDashboard;
    const IconComponent = (icons as any)[iconName];
    return IconComponent || icons.LayoutDashboard;
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50">
      <div className="p-3 border-b border-sidebar-border">
        <img src={logoLight} alt="Logo" className="h-10 w-auto mx-auto" />
        <p className="text-center text-xs text-sidebar-foreground/60 mt-1.5 font-medium">
          Painéis e Dashboards
        </p>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {routes.map((route) => {
          const Icon = getIcon(route.icon);

          return (
            <NavLink
              key={route.key}
              to={route.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{route.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
