import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: FileText },
  { name: "Orçamentos", href: "/dashboard/orcamentos", icon: Calculator },
  { name: "Pedidos", href: "/dashboard/pedidos", icon: FileText },
  { name: "Visitas", href: "/dashboard/visitas", icon: Calendar },
  { name: "Produção", href: "/dashboard/producao", icon: Factory, adminOrManagerFabril: true },
  { name: "Usuários", href: "/dashboard/users", icon: Users, adminOnly: true },
  { name: "Faturamento", href: "/dashboard/faturamento", icon: LayoutDashboard, adminOrManager: true },
  { name: "Marketing", href: "/dashboard/marketing", icon: TrendingUp, adminOrManager: true },
  { name: "Contas a Receber", href: "/dashboard/contas-receber", icon: CreditCard, adminOrManager: true },
  { name: "Organograma", href: "/dashboard/organograma", icon: Users, adminOnly: true },
  { name: "Calendário", href: "/dashboard/calendario", icon: CalendarDays },
  { name: "Contador de vendas", href: "/dashboard/contador-vendas", icon: DollarSign },
  { name: "Autorizados", href: "/dashboard/autorizados", icon: Users, adminOnly: true },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user, isAdmin, isGerenteFabril, isGerenteComercial, userRole } = useAuth();
  const { state } = useSidebar();

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const filteredNavigation = navigation.filter((item) => {
    if ((item as any).adminOnly && !isAdmin) return false;
    if ((item as any).adminOrManager && !isAdmin && !isGerenteComercial) return false;
    if ((item as any).adminOrManagerFabril && !isAdmin && !isGerenteComercial && !isGerenteFabril) return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-1">
          <img
            src="/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png"
            alt="Elisa Portas"
            className="h-8 w-auto"
          />
          {state === "expanded" && (
            <span className="font-semibold text-sidebar-foreground">Elisa Portas</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <NavLink to={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && (
          <div className="px-2 py-1 mb-2 space-y-1">
            {state === "expanded" && (
              <>
                <div className="font-medium text-sm truncate">{user.email}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {userRole?.role?.replace("_", " ")}
                </div>
              </>
            )}
          </div>
        )}
        {isAdmin && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/dashboard/configuracoes">
                  <Settings className="h-5 w-5" />
                  <span>Configurações</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <div className="px-2">
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            {state === "expanded" ? "Sair" : "S"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
