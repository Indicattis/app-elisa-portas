import { NavLink } from "react-router-dom";
import { Flame, Settings, Package, Paintbrush, ClipboardCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdensCount } from "@/hooks/useOrdensCount";
import { Badge } from "./ui/badge";
import logoLight from "@/assets/logo-light.png";

const menuItems = [
  { to: "/producao/solda", label: "Solda", icon: Flame },
  { to: "/producao/perfiladeira", label: "Perfiladeira", icon: Settings },
  { to: "/producao/separacao", label: "Separação", icon: Package },
  { to: "/producao/pintura", label: "Pintura", icon: Paintbrush },
  { to: "/producao/qualidade", label: "Qualidade", icon: ClipboardCheck },
  { to: "/producao/carregamento", label: "Carregamento", icon: Truck },
];

export function ProducaoSidebar() {
  const { data: ordensCount } = useOrdensCount();

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
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <img src={logoLight} alt="Logo" className="h-12 w-auto mx-auto" />
        <p className="text-center text-sm text-sidebar-foreground/60 mt-2 font-medium">
          Interface de Produção
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const tipo = item.to.split("/").pop() || "";
          const count = getCount(tipo);
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-colors text-base font-medium",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground"
                )
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
              {count > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {count}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
