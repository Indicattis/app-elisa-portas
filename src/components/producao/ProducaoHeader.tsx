import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { useState, useEffect } from "react";

export function ProducaoHeader() {
  const { user, signOut } = useProducaoAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (!user) return null;

  const getUserInitials = (nome: string) => {
    const parts = nome.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nome.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2" />
        <div className="h-6 w-px bg-border" />
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="text-sm text-muted-foreground capitalize">
            {formatDate(currentTime)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.foto_perfil_url} alt={user.nome} />
            <AvatarFallback className="text-sm font-medium">
              {getUserInitials(user.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col">
            <span className="font-medium text-foreground leading-none">{user.nome}</span>
            <span className="text-sm text-muted-foreground capitalize leading-none mt-1">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
