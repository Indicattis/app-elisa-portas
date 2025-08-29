import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign, BarChart3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Mapeamento de ícones por nome
const iconMap: Record<string, any> = {
  LayoutDashboard,
  BarChart3,
  FileText,
  Calculator,
  Calendar,
  Factory,
  TrendingUp,
  CreditCard,
  CalendarDays,
  DollarSign,
  Users,
  Settings,
};

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { state } = useSidebar();
  const { tabs, loading } = useTabsAccess('sidebar');

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Settings;
    return iconMap[iconName] || Settings;
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
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              ) : (
                tabs.map((tab) => {
                  const Icon = getIcon(tab.icon);
                  const isTabActive = isActive(tab.href);
                  
                  return (
                    <SidebarMenuItem key={tab.key}>
                      <SidebarMenuButton 
                        asChild={tab.can_access} 
                        isActive={isTabActive}
                        className={`${!tab.can_access ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {tab.can_access ? (
                          <NavLink to={tab.href}>
                            <Icon className="h-5 w-5" />
                            <span>{tab.label}</span>
                          </NavLink>
                        ) : (
                          <div className="flex items-center gap-3 px-2 py-1.5">
                            <Icon className="h-5 w-5" />
                            <span>{tab.label}</span>
                            <Lock className="h-3 w-3 ml-auto" />
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
