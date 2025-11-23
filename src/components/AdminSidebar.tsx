import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AppRoute {
  key: string;
  path: string;
  label: string;
  icon?: string;
  sort_order: number;
  interface?: string;
  parent_key?: string | null;
  group?: string | null;
}

export function AdminSidebar() {
  const { user, isAdmin } = useAuth();

  // Buscar rotas da interface admin
  const { data: routes = [] } = useQuery({
    queryKey: ['admin-routes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: routesData, error } = await supabase
        .from('app_routes')
        .select('*')
        .eq('active', true)
        .eq('interface', 'admin')
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

  // Agrupar rotas por parent_key
  const parentRoutes = routes.filter(r => !r.parent_key);
  const childRoutesByParent = routes.reduce((acc, route) => {
    if (route.parent_key) {
      if (!acc[route.parent_key]) {
        acc[route.parent_key] = [];
      }
      acc[route.parent_key].push(route);
    }
    return acc;
  }, {} as Record<string, AppRoute[]>);

  // Estado para controlar quais grupos estão expandidos
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-3 border-b border-sidebar-border">
        <img src={logoLight} alt="Logo" className="h-10 w-auto mx-auto" />
        <p className="text-center text-xs text-sidebar-foreground/60 mt-1.5 font-medium">
          Interface Administrativa
        </p>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-auto">
        {parentRoutes.map((route) => {
          const Icon = getIcon(route.icon);
          const hasChildren = childRoutesByParent[route.key]?.length > 0;
          const isExpanded = expandedGroups[route.key];

          return (
            <div key={route.key}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleGroup(route.key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{route.label}</span>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5">
                      {childRoutesByParent[route.key].map((childRoute) => {
                        const ChildIcon = getIcon(childRoute.icon);
                        return (
                          <NavLink
                            key={childRoute.key}
                            to={childRoute.path}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm font-medium",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground"
                              )
                            }
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{childRoute.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
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
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
