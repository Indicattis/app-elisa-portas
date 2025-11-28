import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
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
import { Tv, Map, BookOpen, Calendar as CalendarIcon, Calculator } from "lucide-react";

interface AppRoute {
  key: string;
  path: string;
  label: string;
  icon?: string;
  sort_order: number;
  interface?: string;
}

// Links rápidos para outras interfaces
const quickLinks = [
  { title: "TV Dashboard", url: "/paineis/tv-dashboard", icon: Tv },
  { title: "Mapa", url: "/paineis/mapa-autorizados", icon: Map },
  { title: "Wiki", url: "/paineis/wiki", icon: BookOpen },
  { title: "Calendário", url: "/paineis/calendario", icon: CalendarIcon },
  { title: "Calculadoras", url: "/paineis/calculadoras", icon: Calculator },
];

export function PaineisSidebar() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();
  const { open } = useSidebar();

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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <img 
            src={logo} 
            alt="Elisa Portas" 
            className="h-8 w-auto transition-all duration-300"
          />
          {open && (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">
                Painéis e Dashboards
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <ScrollArea className="flex-1">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {routes.map((route) => {
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

          {quickLinks.length > 0 && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {quickLinks.map((link) => {
                    const active = isActive(link.url);
                    return (
                      <SidebarMenuItem key={link.url}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={active}
                          tooltip={link.title}
                        >
                          <NavLink to={link.url}>
                            <link.icon className="h-4 w-4" />
                            <span>{link.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Voltar ao Dashboard">
              <NavLink to="/dashboard">
                <icons.LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
