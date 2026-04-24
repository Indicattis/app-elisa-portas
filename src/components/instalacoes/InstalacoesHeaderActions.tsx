import { useNavigate, useLocation } from "react-router-dom";
import { HardHat, Users, CalendarDays, Trophy, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { label: "Ordens", icon: HardHat, path: "/logistica/instalacoes" },
  { label: "Equipes", icon: Users, path: "/logistica/instalacoes/equipes" },
  { label: "Cronograma", icon: CalendarDays, path: "/logistica/instalacoes/cronograma" },
  { label: "Ranking Equipes", icon: Trophy, path: "/logistica/instalacoes/ranking" },
  { label: "Ranking Autorizados", icon: Award, path: "/logistica/instalacoes/ranking-autorizados" },
];

interface Props {
  className?: string;
}

export function InstalacoesHeaderActions({ className }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path
          || (item.path === "/logistica/instalacoes" && location.pathname === "/logistica/instalacoes/ordens-instalacoes");
        return (
          <Button
            key={item.path}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => navigate(item.path)}
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
