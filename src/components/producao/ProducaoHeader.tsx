import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Factory } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function ProducaoHeader() {
  const { user, signOut } = useProducaoAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Verifica se está na home de produção
  const isProducaoHome = location.pathname === '/producao' || location.pathname === '/producao/';

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          {!isProducaoHome ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/producao')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          ) : (
            <>
              <Factory className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Produção</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/hub-fabrica')}
            className="gap-2"
          >
            <Factory className="h-4 w-4" />
            <span className="hidden sm:inline">Hub</span>
          </Button>
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user.nome}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
