import { NavLink } from "react-router-dom";
import { Flame, Settings, Package, Paintbrush, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { Badge } from "./ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "./ui/sidebar";
import logoLight from "@/assets/logo-light.png";

const menuItems = [
  { to: "/producao/solda", label: "Solda", icon: Flame },
  { to: "/producao/perfiladeira", label: "Perfiladeira", icon: Settings },
  { to: "/producao/separacao", label: "Separação", icon: Package },
  { to: "/producao/pintura", label: "Pintura", icon: Paintbrush },
  { to: "/producao/qualidade", label: "Qualidade", icon: ClipboardCheck },
];

export function ProducaoSidebar() {
  const { data: ordensCount } = useOrdensCount();
  const { open } = useSidebar();

  const getCount = (tipo: string) => {
    if (!ordensCount) return 0;
    switch (tipo) {
      case "solda": return ordensCount.soldagem || 0;
      case "perfiladeira": return ordensCount.perfiladeira || 0;
      case "separacao": return ordensCount.separacao || 0;
      case "pintura": return ordensCount.pintura || 0;
      case "qualidade": return ordensCount.qualidade || 0;
      default: return 0;
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-6 border-b border-sidebar-border">
          {open ? (
            <>
              <img src={logoLight} alt="Logo" className="h-12 w-auto mx-auto" />
              <p className="text-center text-sm text-sidebar-foreground/60 mt-2 font-medium">
                Interface de Produção
              </p>
            </>
          ) : (
            <img src={logoLight} alt="Logo" className="h-8 w-auto mx-auto" />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const tipo = item.to.split("/").pop() || "";
                const count = getCount(tipo);

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground"
                          )
                        }
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {open && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {count > 0 && (
                              <Badge variant="secondary" className="ml-auto">
                                {count}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
