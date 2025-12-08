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
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-sky-500/30 rounded-full blur-md" />
            <img 
              src={instalacoesLogo} 
              alt="Instalações" 
              className="relative h-11 w-11 rounded-full object-cover ring-2 ring-sidebar-border shadow-lg"
            />
          </div>
          {open && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Elite Team
              </span>
              <span className="text-sm font-bold text-foreground leading-tight">
                Missão dada é<br />missão cumprida
              </span>
            </div>
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
