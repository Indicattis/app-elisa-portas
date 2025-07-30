import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Calculator, Calendar, Settings, LogOut, Menu, X, Factory, TrendingUp, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
const navigation = [{
  name: "Dashboard",
  href: "/dashboard",
  icon: LayoutDashboard
}, {
  name: "Leads",
  href: "/dashboard/leads",
  icon: FileText
}, {
  name: "Orçamentos",
  href: "/dashboard/orcamentos",
  icon: Calculator
}, {
  name: "Visitas",
  href: "/dashboard/visitas",
  icon: Calendar
}, {
  name: "Produção",
  href: "/dashboard/producao",
  icon: Factory,
  adminOrManagerFabril: true
}, {
  name: "Usuários",
  href: "/dashboard/users",
  icon: Users,
  adminOnly: true
}, {
  name: "Faturamento",
  href: "/dashboard/faturamento",
  icon: LayoutDashboard,
  adminOrManager: true
}, {
  name: "Marketing",
  href: "/dashboard/marketing",
  icon: TrendingUp,
  adminOrManager: true
}, {
  name: "Contas a Receber",
  href: "/dashboard/contas-receber",
  icon: CreditCard,
  adminOrManager: true
}, {
  name: "Organograma",
  href: "/dashboard/organograma",
  icon: Users,
  adminOnly: true
}];
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {
    signOut,
    user,
    isAdmin,
    userRole,
    isGerenteFabril,
    isGerenteComercial
  } = useAuth();
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.adminOrManager && !isAdmin && !isGerenteComercial) return false;
    if (item.adminOrManagerFabril && !isAdmin && !isGerenteComercial && !isGerenteFabril) return false;
    return true;
  });
  return <div className={`bg-card border-r border-border transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!collapsed && <div className="flex items-center space-x-3">
                <img src="/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png" alt="Elisa Portas" className="h-8 w-auto" />
                
              </div>}
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {filteredNavigation.map(item => <li key={item.name}>
                <NavLink to={item.href} className={() => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                  <item.icon className={`h-5 w-5 ${collapsed ? "" : "mr-3"}`} />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              </li>)}
          </ul>
        </nav>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-border">
          {!collapsed && <div className="mb-4">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole?.role?.replace('_', ' ')}
              </p>
            </div>}
          
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" size={collapsed ? "icon" : "sm"} onClick={signOut} className="flex-1">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>;
}