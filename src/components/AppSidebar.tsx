import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Home, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign, BarChart3, Lock, UserPlus, FileSpreadsheet, ShoppingCart, MapPin, Cog, Handshake, FolderOpen, Wrench, Receipt, Megaphone, Banknote, Network, Target, LayoutDashboard, Briefcase, Package, UserCog, Award, ChevronDown, BookOpen, Truck, ChevronsDown, ChevronsUp, Clock, CheckSquare, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { Badge } from "@/components/ui/badge";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar 
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { icons } from "lucide-react";

// Mapeamento de ícones do Lucide
const iconMap: Record<string, any> = {
  Home,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  UserPlus,
  FileText,
  FileSpreadsheet,
  Calculator,
  ShoppingCart,
  Calendar,
  CalendarDays,
  MapPin,
  Factory,
  Cog,
  Users,
  Handshake,
  FolderOpen,
  Wrench,
  Receipt,
  Megaphone,
  CreditCard,
  Banknote,
  Network,
  DollarSign,
  Target,
  Settings,
  Briefcase,
  Package,
  UserCog,
  Award,
  BookOpen,
  Truck,
  CheckSquare,
  ClipboardCheck,
};

// Checklist colors removed - now using global task system

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { state } = useSidebar();
  const { data: ordensCount } = useOrdensCount();
  const { theme } = useTheme();
  
  // Buscar rotas com verificação de acesso usando has_route_access
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['sidebar-routes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('app_routes')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      // Verificar acesso para cada rota
      const routesWithAccess = await Promise.all(
        (data || []).map(async (route) => {
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
      
      return routesWithAccess;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  
  // Agrupar rotas por grupo
  const groupedRoutes = routes.reduce((acc, route) => {
    const groupName = route.group || 'Outros';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(route);
    return acc;
  }, {} as Record<string, typeof routes>);
  
  // Persistir estado dos grupos no localStorage
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-groups-state');
    return saved ? JSON.parse(saved) : {};
  });

  // Ref para controlar se já fizemos a inicialização automática
  const hasInitialized = useRef(false);

  // Salvar estado quando mudar
  useEffect(() => {
    localStorage.setItem('sidebar-groups-state', JSON.stringify(openGroups));
  }, [openGroups]);

  // Auto-expandir grupo na primeira vez (apenas se não houver estado salvo)
  useEffect(() => {
    if (hasInitialized.current || Object.keys(groupedRoutes).length === 0) return;
    
    const saved = localStorage.getItem('sidebar-groups-state');
    const hasSavedState = saved && Object.keys(JSON.parse(saved)).length > 0;
    
    // Só auto-expande se não houver estado salvo previamente
    if (!hasSavedState) {
      Object.entries(groupedRoutes).forEach(([groupName, groupRoutes]) => {
        const hasActiveChild = groupRoutes.some(route => 
          location.pathname === route.path || location.pathname.startsWith(route.path + '/')
        );
        
        if (hasActiveChild) {
          setOpenGroups(prev => ({ ...prev, [groupName]: true }));
        }
      });
    }
    
    hasInitialized.current = true;
  }, [groupedRoutes, location.pathname]);
  
  // Determinar qual logo usar baseado no tema
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentLogo = isDarkMode ? logoLight : logoDark;

  const isActive = (path: string) => {
    if (path === '#') return false;
    // Comparação exata para evitar que itens pais fiquem ativos
    return location.pathname === path;
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Settings;
    return iconMap[iconName] || icons[iconName as keyof typeof icons] || Settings;
  };

  const handleGroupToggle = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleOpenAll = () => {
    const allOpen = Object.keys(groupedRoutes).reduce((acc, group) => {
      acc[group] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setOpenGroups(allOpen);
  };

  const handleCloseAll = () => {
    const allClosed = Object.keys(groupedRoutes).reduce((acc, group) => {
      acc[group] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setOpenGroups(allClosed);
  };

  // Estado para o relógio
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formatar hora de Brasília
  const brasiliaTime = currentTime.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <div className="flex gap-2 px-2 py-2 border-b">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center px-2 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          title="Home"
        >
          <img
            src={currentLogo}
            alt="Home"
            className="h-5 w-5 object-contain"
          />
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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                Object.entries(groupedRoutes).map(([groupName, groupRoutes]) => {
                  const firstRoute = groupRoutes[0];
                  const GroupIcon = getIcon(firstRoute?.icon);
                  const isGroupOpen = openGroups[groupName] ?? false;
                  
                  return (
                    <Collapsible
                      key={groupName}
                      open={isGroupOpen}
                      onOpenChange={() => handleGroupToggle(groupName)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full">
                            <GroupIcon className="h-5 w-5" />
                            <span>{groupName}</span>
                            <ChevronDown 
                              className={cn(
                                "ml-auto h-4 w-4 transition-transform duration-200",
                                isGroupOpen && "rotate-180"
                              )} 
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="transition-all duration-300 ease-in-out">
                          <SidebarMenuSub>
                            {groupRoutes.map((route) => {
                              const RouteIcon = getIcon(route.icon);
                              const canAccess = route.can_access;
                              const itemIsActive = canAccess && isActive(route.path);
                              
                              // Mapeamento de keys para counts de ordens
                              const ordensCountMap: Record<string, number> = {
                                'producao_solda': ordensCount?.soldagem || 0,
                                'producao_perfiladeira': ordensCount?.perfiladeira || 0,
                                'producao_separacao': ordensCount?.separacao || 0,
                                'producao_qualidade': ordensCount?.qualidade || 0,
                                'producao_pintura': ordensCount?.pintura || 0,
                              };
                              
                              return (
                                <SidebarMenuSubItem key={route.key}>
                                  <SidebarMenuSubButton 
                                    asChild={canAccess}
                                    isActive={itemIsActive}
                                    className={cn(
                                      !canAccess ? "opacity-50 cursor-not-allowed" : ""
                                    )}
                                    data-active={itemIsActive}
                                  >
                                    {canAccess ? (
                                      <Link to={route.path} className="flex items-center gap-2 w-full">
                                        <RouteIcon className="h-4 w-4" />
                                        <span>{route.label}</span>
                                        {ordensCountMap[route.key] > 0 && (
                                          <Badge 
                                            variant="secondary" 
                                            className="ml-auto h-5 min-w-5 px-1.5 text-xs font-semibold"
                                          >
                                            {ordensCountMap[route.key]}
                                          </Badge>
                                        )}
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
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary/10 text-primary">
          <Clock className="h-5 w-5 shrink-0" />
          <div className="text-sm font-medium text-center">
            <div>{brasiliaTime.split(', ')[0]}</div>
            <div>{brasiliaTime.split(', ')[1]}</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
