import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Home, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign, BarChart3, Lock, UserPlus, FileSpreadsheet, ShoppingCart, MapPin, Cog, Handshake, FolderOpen, Wrench, Receipt, Megaphone, Banknote, Network, Target, LayoutDashboard, Briefcase, Package, UserCog, Award, ChevronDown, BookOpen, Truck } from "lucide-react";
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
};

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useSidebar();
  const { data: tabs = [], isLoading } = useTabsAccess('sidebar', user?.id);
  
  // Filtrar o diário de bordo dos tabs normais
  const filteredTabs = tabs.filter(tab => tab.key !== 'diario_bordo');
  const diarioBordoTab = tabs.find(tab => tab.key === 'diario_bordo');
  const groupedTabs = useGroupedTabs(filteredTabs);
  const { theme } = useTheme();
  
  // Persistir estado dos grupos no localStorage
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-groups-state');
    return saved ? JSON.parse(saved) : {};
  });

  // Salvar estado quando mudar
  useEffect(() => {
    localStorage.setItem('sidebar-groups-state', JSON.stringify(openGroups));
  }, [openGroups]);

  // Auto-expandir grupo que contém a rota ativa
  useEffect(() => {
    groupedTabs.forEach(group => {
      const hasActiveChild = group.children.some(child => 
        location.pathname === child.href || location.pathname.startsWith(child.href + '/')
      );
      
      if (hasActiveChild && !openGroups[group.key]) {
        setOpenGroups(prev => ({ ...prev, [group.key]: true }));
      }
    });
  }, [location.pathname, groupedTabs]);
  
  // Determinar qual logo usar baseado no tema
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentLogo = isDarkMode ? logoLight : logoDark;

  const isActive = (path: string) => {
    if (path === '#') return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Settings;
    return iconMap[iconName] || icons[iconName as keyof typeof icons] || Settings;
  };

  const handleGroupToggle = (groupKey: string) => {
    setOpenGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="h-12">
        <div className="flex items-center justify-center px-2 h-12">
          <div className="w-full max-w-[120px] h-12 flex items-center justify-center">
            <img
              src={currentLogo}
              alt="Elisa Portas"
              className="w-full h-auto max-h-[50px] min-w-[25px] min-h-[25px] object-contain -translate-y-[10px]"
            />
          </div>
        </div>
      </SidebarHeader>

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
                              
                              return (
                                <SidebarMenuSubItem key={subItem.key}>
                                  <SidebarMenuSubButton 
                                    asChild={canAccess}
                                    isActive={itemIsActive}
                                    className={!canAccess ? "opacity-50 cursor-not-allowed" : ""}
                                  >
                                    {canAccess ? (
                                      <a href={subItem.href}>
                                        <SubIcon className="h-4 w-4" />
                                        <span>{subItem.label}</span>
                                      </a>
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
        {diarioBordoTab && diarioBordoTab.can_access && (
          <button
            onClick={() => navigate('/dashboard/diario-bordo')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg",
              "bg-primary text-primary-foreground font-medium",
              "hover:bg-primary/90 transition-all duration-200",
              "shadow-md hover:shadow-lg",
              isActive('/dashboard/diario-bordo') && "ring-2 ring-primary-foreground/20"
            )}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-sm">Diário de Bordo</span>
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
