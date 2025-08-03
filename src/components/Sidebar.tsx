import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Calculator, Calendar, Settings, LogOut, Menu, X, Factory, TrendingUp, CreditCard, CalendarDays, ChevronRight } from "lucide-react";
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
}, {
  name: "Calendário",
  href: "/dashboard/calendario",
  icon: CalendarDays
}, {
  name: "Autorizados",
  href: "/dashboard/autorizados",
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
  return (
    <div className={`bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-sm border-r border-border/50 shadow-lg transition-all duration-500 ease-in-out ${collapsed ? "w-16" : "w-72"}`}>
      <div className="flex flex-col h-full relative">
        {/* Modern Header with Gradient */}
        <div className="relative p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center space-x-3 animate-fade-in">
                <div className="relative">
                  <img 
                    src="/lovable-uploads/9f8b49f3-817e-40f0-87b0-856e0cbe536a.png" 
                    alt="Elisa Portas" 
                    className="h-10 w-auto transition-all duration-300 hover:scale-105 drop-shadow-md" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="relative overflow-hidden hover:bg-primary/10 hover:scale-110 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              {collapsed ? (
                <Menu className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              ) : (
                <X className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              )}
            </Button>
          </div>
        </div>

        {/* Modern Navigation with Smooth Animations */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavigation.map((item, index) => (
            <div key={item.name} className="relative group">
              <NavLink 
                to={item.href} 
                className={() => `
                  relative flex items-center px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-300 ease-in-out transform
                  ${isActive(item.href) 
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg scale-105 translate-x-1" 
                    : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent hover:scale-105 hover:translate-x-1"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Active Indicator */}
                {isActive(item.href) && !collapsed && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full animate-scale-in"></div>
                )}
                
                {/* Icon with Animation */}
                <div className="relative">
                  <item.icon className={`h-5 w-5 transition-all duration-300 ${collapsed ? "" : "mr-4"} ${isActive(item.href) ? "drop-shadow-sm" : "group-hover:scale-110"}`} />
                  {isActive(item.href) && (
                    <div className="absolute inset-0 bg-primary-foreground/20 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {/* Text with Fade Animation */}
                {!collapsed && (
                  <span className="animate-fade-in transition-all duration-300 group-hover:font-semibold">
                    {item.name}
                  </span>
                )}
                
                {/* Hover Arrow */}
                {!collapsed && !isActive(item.href) && (
                  <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300" />
                )}
              </NavLink>
              
              {/* Tooltip for Collapsed State */}
              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap">
                  {item.name}
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-popover"></div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Botão de Configurações */}
        {isAdmin && (
          <div className="px-4 pb-2">
            <div className="relative group">
              <NavLink 
                to="/dashboard/configuracoes" 
                className={() => `
                  relative flex items-center px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-300 ease-in-out transform
                  ${isActive("/dashboard/configuracoes") 
                    ? "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-lg scale-105 translate-x-1" 
                    : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent hover:scale-105 hover:translate-x-1"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                {/* Active Indicator */}
                {isActive("/dashboard/configuracoes") && !collapsed && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-secondary-foreground rounded-r-full animate-scale-in"></div>
                )}
                
                {/* Icon with Animation */}
                <div className="relative">
                  <Settings className={`h-5 w-5 transition-all duration-300 ${collapsed ? "" : "mr-4"} ${isActive("/dashboard/configuracoes") ? "drop-shadow-sm" : "group-hover:scale-110"}`} />
                  {isActive("/dashboard/configuracoes") && (
                    <div className="absolute inset-0 bg-secondary-foreground/20 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {/* Text with Fade Animation */}
                {!collapsed && (
                  <span className="animate-fade-in transition-all duration-300 group-hover:font-semibold">
                    Configurações
                  </span>
                )}
                
                {/* Hover Arrow */}
                {!collapsed && !isActive("/dashboard/configuracoes") && (
                  <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all duration-300" />
                )}
              </NavLink>
              
              {/* Tooltip for Collapsed State */}
              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap">
                  Configurações
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-popover"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modern User Info & Actions with Gradient */}
        <div className="p-4 border-t border-border/30 bg-gradient-to-r from-muted/30 to-transparent backdrop-blur-sm">
          {!collapsed && (
            <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-card to-transparent border border-border/20 animate-fade-in">
              <p className="text-sm font-semibold text-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize font-medium">
                {userRole?.role?.replace('_', ' ')}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <div className="relative overflow-hidden rounded-lg">
              <ThemeToggle />
            </div>
            <Button 
              variant="outline" 
              size={collapsed ? "icon" : "sm"} 
              onClick={signOut} 
              className="flex-1 relative overflow-hidden group border-destructive/20 hover:border-destructive/40 hover:bg-destructive/5 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              {!collapsed && <span className="ml-2 font-medium">Sair</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}