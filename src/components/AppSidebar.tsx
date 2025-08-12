import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Calculator, Calendar, Settings, Factory, TrendingUp, CreditCard, CalendarDays, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: FileText },
  { name: "Orçamentos", href: "/dashboard/orcamentos", icon: Calculator },
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

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const filteredNavigation = navigation.filter((item) => {
    if ((item as any).adminOnly && !isAdmin) return false;
    if ((item as any).adminOrManager && !isAdmin && !isGerenteComercial) return false;
    if ((item as any).adminOrManagerFabril && !isAdmin && !isGerenteComercial && !isGerenteFabril) return false;
    return true;
  });

  return (
    <aside className="w-64 bg-card border-r border-border/50 min-h-screen flex flex-col">
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <img
            src="/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png"
            alt="Elisa Portas"
            className="h-8 w-auto"
          />
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={() => `
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm
              ${isActive(item.href) ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}
            `}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border/40 space-y-1 text-sm">
        {user && (
          <div className="mb-2">
            <div className="font-medium truncate">{user.email}</div>
            <div className="text-xs text-muted-foreground capitalize">{userRole?.role?.replace("_", " ")}</div>
          </div>
        )}
        {isAdmin && (
          <NavLink
            to="/dashboard/configuracoes"
            className={() => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted`}
          >
            <Settings className="h-5 w-5" />
            <span>Configurações</span>
          </NavLink>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
          Sair
        </Button>
      </div>
    </aside>
  );
}
