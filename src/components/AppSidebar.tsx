import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { AppPermission } from "@/types/permissions";
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

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  permission?: AppPermission;
}

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { name: "Performance", href: "/dashboard/performance", icon: BarChart3, permission: "dashboard" },
  { name: "Leads", href: "/dashboard/leads", icon: FileText, permission: "leads" },
  { name: "Orçamentos", href: "/dashboard/orcamentos", icon: Calculator, permission: "orcamentos" },
  { name: "Pedidos", href: "/dashboard/pedidos", icon: FileText, permission: "vendas" },
  { name: "Visitas", href: "/dashboard/visitas", icon: Calendar, permission: "visitas" },
  { name: "Produção", href: "/dashboard/producao", icon: Factory, permission: "producao" },
  { name: "Instalações", href: "/dashboard/instalacoes", icon: Calendar, permission: "producao" },
  { name: "Faturamento", href: "/dashboard/faturamento", icon: LayoutDashboard, permission: "faturamento" },
  { name: "Marketing", href: "/dashboard/marketing", icon: TrendingUp, permission: "marketing" },
  { name: "Contas a Receber", href: "/dashboard/contas-receber", icon: CreditCard, permission: "contas_receber" },
  { name: "Organograma", href: "/dashboard/organograma", icon: Users, permission: "organograma" },
  { name: "Calendário", href: "/dashboard/calendario", icon: CalendarDays, permission: "calendario" },
  { name: "Contador de vendas", href: "/dashboard/contador-vendas", icon: DollarSign, permission: "contador_vendas" },
  { name: "Autorizados", href: "/dashboard/autorizados", icon: Users, permission: "users" },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings, permission: "configuracoes" },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user, isAdmin } = useAuth();
  const { hasPermission } = useUserPermissions();
  const { state } = useSidebar();

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const filteredNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    return isAdmin || hasPermission(item.permission);
  });

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
        {/* Informações do usuário transferidas para o header */}
      </SidebarFooter>
    </Sidebar>
  );
}
