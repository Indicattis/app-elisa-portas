import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Home, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign, BarChart3, Lock, UserPlus, FileSpreadsheet, ShoppingCart, MapPin, Cog, Handshake, FolderOpen, Wrench, Receipt, Megaphone, Banknote, Network, Target, LayoutDashboard, Briefcase, Package, UserCog, Award, BookOpen, Truck, Clock, CheckSquare, ClipboardCheck, ChevronRight, Tv, ClipboardList, Shield, Building2, FileBarChart, PieChart, Wallet, BadgeDollarSign, Users2, Hammer, PackageCheck, ClipboardSignature, CalendarCheck, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { Badge } from "@/components/ui/badge";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { icons } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
interface AppRoute {
  key: string;
  path: string;
  label: string;
  icon?: string;
  group?: string;
  description?: string | null;
  sort_order: number;
  interface?: string;
  parent_key?: string | null;
  can_access?: boolean;
}

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
  CalendarCheck,
  MapPin,
  Factory,
  Cog,
  Users,
  Users2,
  Handshake,
  FolderOpen,
  Wrench,
  Receipt,
  Megaphone,
  CreditCard,
  Banknote,
  Network,
  DollarSign,
  BadgeDollarSign,
  Target,
  Settings,
  Briefcase,
  Package,
  PackageCheck,
  UserCog,
  Award,
  BookOpen,
  Truck,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  ClipboardSignature,
  Shield,
  Building2,
  FileBarChart,
  PieChart,
  Wallet,
  Hammer
};
export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    isAdmin
  } = useAuth();
  const {
    state
  } = useSidebar();
  const {
    data: ordensCount
  } = useOrdensCount();
  const {
    theme
  } = useTheme();

  // Buscar rotas apenas da interface dashboard
  const {
    data: routes = [],
    isLoading
  } = useQuery({
    queryKey: ['sidebar-routes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const {
        data,
        error
      } = await supabase.from('app_routes').select('*').eq('active', true).eq('interface', 'dashboard').order('sort_order', {
        ascending: true
      });
      if (error) throw error;

      // Verificar acesso para cada rota
      const routesWithAccess = await Promise.all((data || []).map(async route => {
        // Admin sempre tem acesso
        if (isAdmin) {
          return {
            ...route,
            can_access: true
          };
        }

        // Verificar acesso via função RLS
        const {
          data: hasAccess
        } = await supabase.rpc('has_route_access', {
          _user_id: user.id,
          _route_key: route.key
        });
        return {
          ...route,
          can_access: hasAccess || false
        };
      }));
      return routesWithAccess as AppRoute[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  // Função recursiva para construir árvore completa de 3+ níveis
  const buildRouteTree = (routes: AppRoute[], parentKey: string | null = null): any[] => {
    return routes.filter(route => route.parent_key === parentKey).map(route => ({
      ...route,
      children: buildRouteTree(routes, route.key)
    }));
  };

  // Construir árvore completa (excluindo dashboard da lista)
  const routeTree = buildRouteTree(routes.filter(r => r.key !== 'dashboard'), null);

  // Persistir estado dos grupos no localStorage
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-groups-state');
    return saved ? JSON.parse(saved) : {};
  });

  // Salvar estado quando mudar
  useEffect(() => {
    localStorage.setItem('sidebar-groups-state', JSON.stringify(openGroups));
  }, [openGroups]);

  // Determinar qual logo usar baseado no tema
  const isDarkMode = theme === "dark" || theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const currentLogo = isDarkMode ? logoLight : logoDark;
  const isActive = (path: string) => {
    if (path === '#') return false;
    // Comparação exata para evitar que itens pais fiquem ativos
    return location.pathname === path;
  };
  const getIcon = (iconName: string | null | undefined) => {
    if (!iconName) return Settings;
    return iconMap[iconName] || icons[iconName as keyof typeof icons] || Settings;
  };
  const toggleGroup = (routeKey: string, open: boolean) => {
    setOpenGroups(prev => ({
      ...prev,
      [routeKey]: open
    }));
  };
  // Estado da pesquisa
  const [searchTerm, setSearchTerm] = useState("");

  // Normalizar texto para busca (remove acentos e lowercase)
  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar rotas recursivamente
  const filterRoutes = (routes: any[], term: string): any[] => {
    if (!term.trim()) return routes;
    
    const normalizedTerm = normalizeText(term);
    
    return routes.reduce((acc: any[], route) => {
      const normalizedLabel = normalizeText(route.label);
      const matches = normalizedLabel.includes(normalizedTerm);
      
      const filteredChildren = route.children ? filterRoutes(route.children, term) : [];
      
      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...route,
          children: filteredChildren,
        });
      }
      
      return acc;
    }, []);
  };

  const filteredRouteTree = useMemo(() => filterRoutes(routeTree, searchTerm), [routeTree, searchTerm]);

  // Auto-expandir grupos quando pesquisando
  useEffect(() => {
    if (searchTerm.trim()) {
      const getAllKeys = (routes: any[]): string[] => {
        return routes.flatMap((route) => [
          route.key,
          ...(route.children ? getAllKeys(route.children) : []),
        ]);
      };
      const allKeys = getAllKeys(filteredRouteTree);
      const allOpen = allKeys.reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setOpenGroups(allOpen);
    }
  }, [searchTerm, filteredRouteTree]);

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

  // Mapeamento de keys para counts de ordens
  const ordensCountMap: Record<string, number> = {
    'producao_solda': ordensCount?.solda || 0,
    'producao_perfiladeira': ordensCount?.perfiladeira || 0,
    'producao_separacao': ordensCount?.separacao || 0,
    'producao_qualidade': ordensCount?.qualidade || 0,
    'producao_pintura': ordensCount?.pintura || 0,
    'producao_carregamento': ordensCount?.carregamento || 0
  };

  // Função recursiva para renderizar itens da sidebar
  const renderRouteItem = (route: any, level: number): React.ReactNode => {
    const RouteIcon = getIcon(route.icon);
    const canAccess = route.can_access;
    const itemIsActive = canAccess && isActive(route.path);
    const hasChildren = route.children && route.children.length > 0;
    const count = ordensCountMap[route.key] || 0;

    // Se não tem acesso e não tem children acessíveis, não renderizar
    if (!canAccess && !hasChildren) return null;

    // Rota com children (pasta)
    if (hasChildren) {
      const hasAccessToChildren = route.children.some((c: any) => c.can_access || c.children && c.children.length > 0);
      if (!hasAccessToChildren && !canAccess) return null;
      const isOpen = openGroups[route.key] ?? false;
      const isHomeActive = canAccess && isActive(route.path);
      return <Collapsible key={route.key} open={isOpen} onOpenChange={open => toggleGroup(route.key, open)} className="group/collapsible">
          <SidebarMenuItem>
            <div className="flex items-center w-full">
              {/* Link para navegação (clique no item) */}
              <SidebarMenuButton asChild={canAccess} isActive={isHomeActive} className={cn("flex-1 cursor-pointer", !canAccess && "opacity-50")}>
                {canAccess ? <Link to={route.path} className="flex items-center gap-2">
                    <RouteIcon className="h-5 w-5" />
                    <span>{route.label}</span>
                  </Link> : <div className="flex items-center gap-2">
                    <RouteIcon className="h-5 w-5" />
                    <span>{route.label}</span>
                  </div>}
              </SidebarMenuButton>
              
              {/* Botão separado para expandir/colapsar */}
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-center h-8 w-8 hover:bg-accent rounded-md transition-colors" onClick={e => {
                e.stopPropagation();
              }}>
                  <ChevronRight className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-90")} />
                </button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="transition-all duration-300 ease-in-out">
              <SidebarMenuSub>
                {route.children.map((child: any) => renderRouteItem(child, level + 1))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>;
    }

    // Rota sem children (item final)
    return <SidebarMenuSubItem key={route.key}>
        <SidebarMenuSubButton asChild={canAccess} isActive={itemIsActive} className={cn(!canAccess && "opacity-50 cursor-not-allowed")}>
          {canAccess ? <Link to={route.path} className="flex items-center gap-2 w-full">
              <RouteIcon className="h-4 w-4" />
              <span>{route.label}</span>
              {count > 0 && <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1.5 text-xs font-semibold">
                  {count}
                </Badge>}
            </Link> : <div className="flex items-center gap-2 w-full">
              <RouteIcon className="h-4 w-4" />
              <span>{route.label}</span>
              <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
            </div>}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>;
  };
  return <Sidebar collapsible="offcanvas" className="border-r">
      <div className="flex gap-2 px-2 py-2 border-b">
        <button onClick={() => navigate('/dashboard')} className="flex items-center justify-center px-2 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors" title="Home">
          <img src={currentLogo} alt="Home" className="h-5 w-5 object-contain" />
        </button>
        <div className="relative flex-1">
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

      <SidebarContent>
        <ScrollArea className="flex-1 px-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading ? <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div> : filteredRouteTree.map(route => renderRouteItem(route, 0))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1.5">
        

        {/* Botões de acesso rápido a outras interfaces */}
        <div className="space-y-1">
          <Link to="/paineis" className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent hover:bg-accent/80 text-accent-foreground transition-colors text-xs font-medium">
            <Tv className="h-4 w-4" />
            <span>Painéis</span>
          </Link>
          
          <Link to="/producao" className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent hover:bg-accent/80 text-accent-foreground transition-colors text-xs font-medium">
            <Factory className="h-3.5 w-3.5" />
            <span>Produção</span>
          </Link>
          
          <Link to="/instalacoes" className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent hover:bg-accent/80 text-accent-foreground transition-colors text-xs font-medium">
            <CalendarCheck className="h-3.5 w-3.5" />
            <span>Instalações</span>
          </Link>
          
          <Link to="/todo" className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent hover:bg-accent/80 text-accent-foreground transition-colors text-xs font-medium">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Tarefas</span>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>;
}