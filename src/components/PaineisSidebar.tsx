import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

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
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

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

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-sm border-r border-border/50 shadow-lg transition-all duration-500 ease-in-out z-50 ${collapsed ? "w-16" : "w-72"}`}>
      <div className="flex flex-col h-full relative">
        {/* Modern Header with Gradient */}
        <div className="relative p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex flex-col space-y-1 animate-fade-in">
                <div className="relative">
                  <img 
                    src="/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png" 
                    alt="Elisa Portas" 
                    className="h-8 md:h-10 w-auto transition-all duration-300 hover:scale-105 drop-shadow-md" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Painéis e Dashboards
                </p>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-muted"
            >
              {collapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Modern Navigation with Smooth Animations */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {routes.map((route) => {
            const Icon = getIcon(route.icon);
            const active = isActive(route.path);

            return (
              <div key={route.key} className="relative group">
                <NavLink 
                  to={route.path} 
                  className={cn(
                    "relative flex items-center px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium",
                    "transition-colors duration-200",
                    active 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    collapsed ? "justify-center" : ""
                  )}
                >
                  {/* Active Indicator */}
                  {active && !collapsed && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full animate-scale-in"></div>
                  )}
                  
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${collapsed ? "" : "mr-4"}`} />
                  
                  {!collapsed && (
                    <span>{route.label}</span>
                  )}
                </NavLink>
                
                {/* Tooltip for Collapsed State */}
                {collapsed && (
                  <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap">
                    {route.label}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-popover"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
