import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as icons from "lucide-react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const { theme } = useTheme();
  const { open } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");

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

  const logo = theme === 'dark' ? logoDark : logoLight;

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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <img 
            src={logo} 
            alt="Elisa Portas" 
            className="h-8 w-auto transition-all duration-300"
          />
          {open && (
            <span className="text-xs text-muted-foreground font-medium">
              Painéis e Dashboards
            </span>
          )}
        </div>
        {open && (
          <div className="px-2 pb-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-7 pr-7 text-xs"
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
        )}
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredRoutes.map((route) => {
                  const Icon = getIcon(route.icon);
                  const active = isActive(route.path);

                  return (
                    <SidebarMenuItem key={route.key}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={active}
                        tooltip={route.label}
                      >
                        <NavLink to={route.path}>
                          <Icon className="h-4 w-4" />
                          <span>{route.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Voltar ao Início">
              <NavLink to="/home">
                <icons.Home className="h-4 w-4" />
                <span>Início</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
