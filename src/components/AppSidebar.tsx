import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Home, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign, BarChart3, Lock, UserPlus, FileSpreadsheet, ShoppingCart, MapPin, Cog, Handshake, FolderOpen, Wrench, Receipt, Megaphone, Banknote, Network, Target, LayoutDashboard, Briefcase, Package, UserCog, Award, ChevronDown, BookOpen, Truck, ChevronsDown, ChevronsUp, Clock, CheckSquare, ClipboardCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTabsAccess } from "@/hooks/useTabsAccess";
import { useGroupedTabs } from "@/hooks/useGroupedTabs";
import { useTheme } from "@/components/ThemeProvider";
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

// Mapeamento de cores para Checklist Liderança por setor
const checklistColors: Record<string, { text: string; hover: string; active: string; badge: string }> = {
  'checklist_lideranca_vendas_group': {
    text: 'text-green-600 dark:text-green-400',
    hover: 'hover:bg-green-50 dark:hover:bg-green-950/30',
    active: 'data-[active=true]:bg-green-100 dark:data-[active=true]:bg-green-900/40 data-[active=true]:text-green-700 dark:data-[active=true]:text-green-300',
    badge: 'bg-green-500'
  },
  'checklist_lideranca_marketing_group': {
    text: 'text-yellow-600 dark:text-yellow-400',
    hover: 'hover:bg-yellow-50 dark:hover:bg-yellow-950/30',
    active: 'data-[active=true]:bg-yellow-100 dark:data-[active=true]:bg-yellow-900/40 data-[active=true]:text-yellow-700 dark:data-[active=true]:text-yellow-300',
    badge: 'bg-yellow-500'
  },
  'checklist_lideranca_fabrica': {
    text: 'text-gray-600 dark:text-gray-400',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-950/30',
    active: 'data-[active=true]:bg-gray-100 dark:data-[active=true]:bg-gray-900/40 data-[active=true]:text-gray-700 dark:data-[active=true]:text-gray-300',
    badge: 'bg-gray-500'
  },
  'checklist_lideranca_instalacoes_group': {
    text: 'text-red-600 dark:text-red-400',
    hover: 'hover:bg-red-50 dark:hover:bg-red-950/30',
    active: 'data-[active=true]:bg-red-100 dark:data-[active=true]:bg-red-900/40 data-[active=true]:text-red-700 dark:data-[active=true]:text-red-300',
    badge: 'bg-red-500'
  },
  'checklist_lideranca_administrativo': {
    text: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-950/30',
    active: 'data-[active=true]:bg-blue-100 dark:data-[active=true]:bg-blue-900/40 data-[active=true]:text-blue-700 dark:data-[active=true]:text-blue-300',
    badge: 'bg-blue-500'
  },
};

// Função helper para obter classes de cor dos Checklist Liderança
const getChecklistColorClass = (itemKey: string, isActive: boolean) => {
  const colors = checklistColors[itemKey];
  if (!colors) return '';
  
  return cn(
    colors.text,
    colors.hover,
    colors.active,
    isActive && 'font-semibold'
  );
};

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useSidebar();
  const { data: tabs = [], isLoading } = useTabsAccess('sidebar', user?.id);
  
  const groupedTabs = useGroupedTabs(tabs);
  const { theme } = useTheme();
  
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
    if (hasInitialized.current || groupedTabs.length === 0) return;
    
    const saved = localStorage.getItem('sidebar-groups-state');
    const hasSavedState = saved && Object.keys(JSON.parse(saved)).length > 0;
    
    // Só auto-expande se não houver estado salvo previamente
    if (!hasSavedState) {
      groupedTabs.forEach(group => {
        const hasActiveChild = group.children.some(child => 
          location.pathname === child.href || location.pathname.startsWith(child.href + '/')
        );
        
        if (hasActiveChild) {
          setOpenGroups(prev => ({ ...prev, [group.key]: true }));
        }
      });
    }
    
    hasInitialized.current = true;
  }, [groupedTabs]);
  
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
    const allOpen = groupedTabs.reduce((acc, group) => {
      acc[group.key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setOpenGroups(allOpen);
  };

  const handleCloseAll = () => {
    const allClosed = groupedTabs.reduce((acc, group) => {
      acc[group.key] = false;
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
                groupedTabs.map((group) => {
                  const GroupIcon = getIcon(group.icon);
                  const isGroupOpen = openGroups[group.key] ?? false;
                  
                  return (
                    <Collapsible
                      key={group.key}
                      open={isGroupOpen}
                      onOpenChange={() => handleGroupToggle(group.key)}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="w-full">
                            <GroupIcon className="h-5 w-5" />
                            <span>{group.label}</span>
                            <ChevronDown 
                              className={cn(
                                "ml-auto h-4 w-4 transition-transform duration-200",
                                isGroupOpen && "rotate-180"
                              )} 
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2">
                          <SidebarMenuSub>
                            {group.children.map((subItem) => {
                              const SubIcon = getIcon(subItem.icon);
                              const canAccess = subItem.can_access;
                              const itemIsActive = canAccess && isActive(subItem.href);
                              
                              // Verificar se este subItem também é um grupo (tem children)
                              const isNestedGroup = tabs.some(t => t.parent_key === subItem.key);
                              const nestedChildren = tabs.filter(t => t.parent_key === subItem.key);
                              
                              if (isNestedGroup && nestedChildren.length > 0) {
                                // Renderizar como um grupo aninhado
                                const isNestedGroupOpen = openGroups[subItem.key] ?? false;
                                
                                return (
                                  <SidebarMenuSubItem key={subItem.key}>
                                    <Collapsible
                                      open={isNestedGroupOpen}
                                      onOpenChange={() => handleGroupToggle(subItem.key)}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <SidebarMenuSubButton className="w-full">
                                          <SubIcon className="h-4 w-4" />
                                          <span>{subItem.label}</span>
                                          <ChevronDown 
                                            className={cn(
                                              "ml-auto h-3 w-3 transition-transform duration-200",
                                              isNestedGroupOpen && "rotate-180"
                                            )} 
                                          />
                                        </SidebarMenuSubButton>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent className="pl-4">
                                        <SidebarMenuSub>
                                          {nestedChildren.map((nestedItem) => {
                                            const NestedIcon = getIcon(nestedItem.icon);
                                            const nestedCanAccess = nestedItem.can_access;
                                            const nestedIsActive = nestedCanAccess && isActive(nestedItem.href);
                                            
                                             return (
                                              <SidebarMenuSubItem key={nestedItem.key}>
                                                <SidebarMenuSubButton 
                                                  asChild={nestedCanAccess}
                                                  isActive={nestedIsActive}
                                                  className={cn(
                                                    !nestedCanAccess ? "opacity-50 cursor-not-allowed" : "",
                                                    getChecklistColorClass(nestedItem.key, nestedIsActive)
                                                  )}
                                                  data-active={nestedIsActive}
                                                >
                                                  {nestedCanAccess ? (
                                                    <Link to={nestedItem.href} className="flex items-center gap-2 w-full">
                                                      <NestedIcon className="h-4 w-4" />
                                                      <span>{nestedItem.label}</span>
                                                      {checklistColors[nestedItem.key] && (
                                                        <span className={cn(
                                                          "w-2 h-2 rounded-full ml-auto",
                                                          checklistColors[nestedItem.key].badge
                                                        )} />
                                                      )}
                                                    </Link>
                                                  ) : (
                                                    <div className="flex items-center gap-2 w-full">
                                                      <NestedIcon className="h-4 w-4" />
                                                      <span>{nestedItem.label}</span>
                                                      <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                                                    </div>
                                                  )}
                                                </SidebarMenuSubButton>
                                              </SidebarMenuSubItem>
                                            );
                                          })}
                                        </SidebarMenuSub>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </SidebarMenuSubItem>
                                );
                              }
                              
                              // Renderizar como item normal
                              return (
                                <SidebarMenuSubItem key={subItem.key}>
                                  <SidebarMenuSubButton 
                                    asChild={canAccess}
                                    isActive={itemIsActive}
                                    className={cn(
                                      !canAccess ? "opacity-50 cursor-not-allowed" : "",
                                      getChecklistColorClass(subItem.key, itemIsActive)
                                    )}
                                    data-active={itemIsActive}
                                  >
                                    {canAccess ? (
                                      <Link to={subItem.href} className="flex items-center gap-2 w-full">
                                        <SubIcon className="h-4 w-4" />
                                        <span>{subItem.label}</span>
                                        {checklistColors[subItem.key] && (
                                          <span className={cn(
                                            "w-2 h-2 rounded-full ml-auto",
                                            checklistColors[subItem.key].badge
                                          )} />
                                        )}
                                      </Link>
                                    ) : (
                                      <div className="flex items-center gap-2 w-full">
                                        <SubIcon className="h-4 w-4" />
                                        <span>{subItem.label}</span>
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
