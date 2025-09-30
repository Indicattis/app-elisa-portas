import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign, BarChart3, Lock, UserPlus, FileSpreadsheet, ShoppingCart, MapPin, Cog, Handshake, FolderOpen, Wrench, Receipt, Megaphone, Banknote, Network, Target, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTabsAccess } from "@/hooks/useTabsAccess";
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
      <SidebarHeader>
        <div className="flex items-center justify-center gap-3 px-2 py-1">
          {state === "expanded" ? (
            <>
              <img
                src="/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png"
                alt="Elisa Portas"
                className="h-8 w-auto"
              />
              <span className="font-semibold text-sidebar-foreground">Elisa Portas</span>
            </>
          ) : (
            <img
              src="/lovable-uploads/9103e850-9847-4e49-8e7b-1423d2953fe8.png"
              alt="Ícone da Empresa"
              className="h-8 w-8"
            />
          )}
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