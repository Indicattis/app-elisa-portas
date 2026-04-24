import { useProducaoAuth } from "@/hooks/useProducaoAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProfileDropdownMenu } from "@/components/ProfileDropdownMenu";

export function ProducaoHeader() {
  const { user } = useProducaoAuth();
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
          {!isProducaoHome && (
            <Button variant="ghost" size="sm" onClick={handleVoltar}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user.nome}
          </span>
          <ProfileDropdownMenu variant="popover" avatarSize={32} />
        </div>
      </div>
    </header>
  );
}
