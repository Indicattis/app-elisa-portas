import { NavLink, useLocation } from "react-router-dom";
import { CalendarCheck, ClipboardList, LayoutDashboard } from "lucide-react";
import instalacoesLogo from "@/assets/instalacoes-logo.png";
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

const menuItems = [
  {
    key: 'calendario',
    path: '/instalacoes',
    label: 'Calendário',
    icon: CalendarCheck,
  },
  {
    key: 'controle',
    path: '/instalacoes/controle',
    label: 'Controle',
    icon: ClipboardList,
  },
];

export function InstalacoesSidebar() {
  const location = useLocation();
  const { open } = useSidebar();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-4">
          <img 
            src={instalacoesLogo} 
            alt="Instalações" 
            className="h-10 w-10 rounded-full object-cover flex-shrink-0"
          />
          {open && (
            <span className="text-xs font-semibold text-foreground leading-tight">
              Missão dada é missão cumprida
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={active}
                      tooltip={item.label}
                    >
                      <NavLink to={item.path}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Voltar ao Dashboard">
              <NavLink to="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
