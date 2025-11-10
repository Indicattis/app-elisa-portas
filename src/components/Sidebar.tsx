import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Calculator, Calendar, Settings, LogOut, Menu, X, Factory, TrendingUp, CreditCard, CalendarDays, ChevronRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
  name: "Calendário",
  href: "/dashboard/calendario",
  icon: CalendarDays
}, {
  name: "Contador de vendas",
  href: "/dashboard/contador-vendas",
  icon: DollarSign
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
    isGerenteComercial,
    isFabrica
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
                    className="h-8 md:h-10 w-auto transition-all duration-300 hover:scale-105 drop-shadow-md" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-muted"
            >
              {collapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
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
                  relative flex items-center px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium
                  transition-colors duration-200
                  ${isActive(item.href) 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                {/* Active Indicator */}
                {isActive(item.href) && !collapsed && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full animate-scale-in"></div>
                )}
                
                <item.icon className={`h-4 w-4 md:h-5 md:w-5 ${collapsed ? "" : "mr-4"}`} />
                
                {!collapsed && (
                  <span>{item.name}</span>
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

        {/* Link para Interface de Produção */}
        {(isFabrica || isAdmin) && (
          <div className="px-4 pb-2">
            <div className="relative group">
              <NavLink 
                to="/producao/login" 
                className="relative flex items-center px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium
                  transition-colors duration-200
                  text-muted-foreground hover:text-foreground hover:bg-muted
                  justify-start
                "
              >
                <Factory className={`h-4 w-4 md:h-5 md:w-5 ${collapsed ? "" : "mr-4"}`} />
                
                {!collapsed && (
                  <span>Interface de Produção</span>
                )}
              </NavLink>
              
              {/* Tooltip for Collapsed State */}
              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap">
                  Interface de Produção
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-popover"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botão de Configurações */}
        {isAdmin && (
          <div className="px-4 pb-2">
            <div className="relative group">
              <NavLink 
                to="/dashboard/configuracoes" 
                className={() => `
                  relative flex items-center px-3 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-medium
                  transition-colors duration-200
                  ${isActive("/dashboard/configuracoes") 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <Settings className={`h-4 w-4 md:h-5 md:w-5 ${collapsed ? "" : "mr-4"}`} />
                
                {!collapsed && (
                  <span>Configurações</span>
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
            <Button
              variant="outline" 
              size={collapsed ? "icon" : "sm"} 
              onClick={signOut} 
              className="flex-1 hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}