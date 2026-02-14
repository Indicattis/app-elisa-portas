import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, Package } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function ProducaoHeader() {
  const { user, signOut } = useProducaoAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Verifica se está na home de produção
  const isProducaoHome = location.pathname === '/producao' || location.pathname === '/producao/';
  
  // Define o destino do botão voltar baseado na rota atual
  const handleVoltar = () => {
    if (isProducaoHome) {
      navigate('/producao');
    } else {
      navigate('/producao');
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="flex items-center gap-3">
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
