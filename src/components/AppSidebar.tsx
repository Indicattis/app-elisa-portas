import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign, BarChart3, Lock, UserPlus, FileSpreadsheet, ShoppingCart, MapPin, Cog, Handshake, FolderOpen, Wrench, Receipt, Megaphone, Banknote, Network, Target, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTabsAccess } from "@/hooks/useTabsAccess";
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
  useSidebar 
} from "@/components/ui/sidebar";
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
};

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user, isAdmin } = useAuth();
  const { state } = useSidebar();
  const { data: tabs = [], isLoading } = useTabsAccess('sidebar');
  const { theme } = useTheme();
  
  // Determinar qual logo usar baseado no tema
  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentLogo = isDarkMode ? logoLight : logoDark;

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Settings;
    return iconMap[iconName] || icons[iconName as keyof typeof icons] || Settings;
  };

  const handleTabClick = (e: React.MouseEvent, canAccess: boolean, href: string) => {
    if (!canAccess) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-12">
        <div className="flex items-center justify-center px-2 h-12">
          <div className="w-full max-w-[120px] h-12 flex items-center justify-center">
            <img
              src={currentLogo}
              alt="Elisa Portas"
              className="w-full h-auto max-h-[50px] min-w-[25px] min-h-[25px] object-contain -translate-x-[5px] -translate-y-[10px]"
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
                tabs.map((tab) => {
                  const IconComponent = getIcon(tab.icon);
                  const canAccess = tab.can_access;
                  
                  return (
                    <SidebarMenuItem key={tab.key}>
                      <SidebarMenuButton 
                        asChild={canAccess} 
                        isActive={canAccess && isActive(tab.href)}
                        className={!canAccess ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {canAccess ? (
                          <NavLink to={tab.href}>
                            <IconComponent className="h-5 w-5" />
                            <span>{tab.label}</span>
                          </NavLink>
                        ) : (
                          <div 
                            className="flex items-center gap-2 w-full"
                            onClick={(e) => handleTabClick(e, canAccess, tab.href)}
                          >
                            <IconComponent className="h-5 w-5" />
                            <span>{tab.label}</span>
                            <Lock className="h-3 w-3 ml-auto text-muted-foreground" />
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
}