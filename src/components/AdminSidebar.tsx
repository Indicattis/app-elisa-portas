import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { useState, useEffect } from "react";
import { ChevronRight, ChevronsDown, ChevronsUp, Lock } from "lucide-react";
import { icons } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();

  // Buscar rotas da interface admin
  const { data: routes = [], isLoading } = useQuery({
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
      const routesWithAccess = await Promise.all(
        (routesData || []).map(async (route) => {
          // Admin sempre tem acesso
          if (isAdmin) {
            return { ...route, can_access: true };
          }

          // Verificar acesso via função RLS
          const { data: hasAccess } = await supabase.rpc('has_route_access', {
            _user_id: user.id,
            _route_key: route.key
          });

          return { ...route, can_access: hasAccess || false };
        })
      );

      return routesWithAccess as AppRoute[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Função recursiva para construir árvore completa
  const buildRouteTree = (routes: AppRoute[], parentKey: string | null = null): any[] => {
    return routes
      .filter((route) => route.parent_key === parentKey)
      .map((route) => ({
        ...route,
        children: buildRouteTree(routes, route.key),
      }));
  };

  const routeTree = buildRouteTree(routes, null);

  // Persistir estado dos grupos no localStorage
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('admin-sidebar-groups-state');
    return saved ? JSON.parse(saved) : {};
  });

  // Salvar estado quando mudar
  useEffect(() => {
    localStorage.setItem('admin-sidebar-groups-state', JSON.stringify(openGroups));
  }, [openGroups]);

  // Determinar qual logo usar baseado no tema
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentLogo = isDarkMode ? logoLight : logoDark;

  const isActive = (path: string) => {
    if (path === '#') return false;
    return location.pathname === path;
  };

  const getIcon = (iconName?: string | null) => {
    if (!iconName) return icons.Settings;
    const IconComponent = icons[iconName as keyof typeof icons];
    return IconComponent || icons.Settings;
  };

  const toggleGroup = (routeKey: string, open: boolean) => {
    setOpenGroups((prev) => ({
      ...prev,
      [routeKey]: open,
    }));
  };

  const handleOpenAll = () => {
    const getAllKeys = (routes: any[]): string[] => {
      return routes.flatMap((route) => [
        route.key,
        ...(route.children ? getAllKeys(route.children) : []),
      ]);
    };
    const allKeys = getAllKeys(routeTree);
    const allOpen = allKeys.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setOpenGroups(allOpen);
  };

  const handleCloseAll = () => {
    setOpenGroups({});
  };

  // Função recursiva para renderizar itens da sidebar
  const renderRouteItem = (route: any, level: number): React.ReactNode => {
    const RouteIcon = getIcon(route.icon);
    const canAccess = route.can_access;
    const itemIsActive = canAccess && isActive(route.path);
    const hasChildren = route.children && route.children.length > 0;

    // Se não tem acesso e não tem children acessíveis, não renderizar
    if (!canAccess && !hasChildren) return null;

    // Rota com children (pasta)
    if (hasChildren) {
      const hasAccessToChildren = route.children.some(
        (c: any) => c.can_access || (c.children && c.children.length > 0)
      );
      if (!hasAccessToChildren && !canAccess) return null;

      const isOpen = openGroups[route.key] ?? false;
      const isHomeActive = canAccess && isActive(route.path);

      return (
        <Collapsible
          key={route.key}
          open={isOpen}
          onOpenChange={(open) => toggleGroup(route.key, open)}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <div className="flex items-center w-full">
              <SidebarMenuButton
                asChild={canAccess}
                isActive={isHomeActive}
                className={cn("flex-1 cursor-pointer", !canAccess && "opacity-50")}
              >
                {canAccess ? (
                  <Link to={route.path} className="flex items-center gap-2">
                    <RouteIcon className="h-5 w-5" />
                    <span>{route.label}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <RouteIcon className="h-5 w-5" />
                    <span>{route.label}</span>
                  </div>
                )}
              </SidebarMenuButton>

              <CollapsibleTrigger asChild>
                <button
                  className="flex items-center justify-center h-8 w-8 hover:bg-accent rounded-md transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="transition-all duration-300 ease-in-out">
              <SidebarMenuSub>
                {route.children.map((child: any) => renderRouteItem(child, level + 1))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Rota sem children (item final)
    return (
      <SidebarMenuSubItem key={route.key}>
        <SidebarMenuSubButton
          asChild={canAccess}
          isActive={itemIsActive}
          className={cn(!canAccess && "opacity-50 cursor-not-allowed")}
        >
          {canAccess ? (
            <Link to={route.path} className="flex items-center gap-2 w-full">
              <RouteIcon className="h-4 w-4" />
              <span>{route.label}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <RouteIcon className="h-4 w-4" />
              <span>{route.label}</span>
              <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
            </div>
          )}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <div className="flex gap-2 px-2 py-2 border-b">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center justify-center px-2 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          title="Admin Home"
        >
          <img src={currentLogo} alt="Admin" className="h-5 w-5 object-contain" />
        </button>
        <button
          onClick={handleOpenAll}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          title="Abrir Todos"
        >
          <ChevronsDown className="h-3 w-3" />
          <span>Abrir</span>
        </button>
        <button
          onClick={handleCloseAll}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          title="Fechar Todos"
        >
          <ChevronsUp className="h-3 w-3" />
          <span>Fechar</span>
        </button>
      </div>

      <SidebarContent>
        <ScrollArea className="flex-1 px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  routeTree.map((route) => renderRouteItem(route, 0))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1.5">
        <div className="space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent hover:bg-accent/80 text-accent-foreground transition-colors text-xs font-medium"
          >
            <icons.LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
