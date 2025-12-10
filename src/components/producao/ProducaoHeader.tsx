import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function ProducaoHeader() {
  const { user, signOut } = useProducaoAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  
  // Verifica se está na home de produção
  const isProducaoHome = location.pathname === '/producao' || location.pathname === '/producao/';

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
    <header className="min-h-14 sm:min-h-16 bg-card border-b border-border px-3 sm:px-6 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-4">
        {!isProducaoHome && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/producao')}
            className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar</span>
          </Button>
        )}
        
        <div className="flex flex-col">
          <span className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] sm:text-sm text-muted-foreground capitalize hidden xs:block">
            {formatDate(currentTime)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage src={user.foto_perfil_url} alt={user.nome} />
            <AvatarFallback className="text-xs sm:text-sm font-medium">
              {getUserInitials(user.nome)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col">
            <span className="font-medium text-foreground leading-none text-sm">{user.nome}</span>
            <span className="text-xs text-muted-foreground capitalize leading-none mt-1">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut()}
          className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}
