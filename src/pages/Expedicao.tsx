import { useNavigate } from "react-router-dom";
import { ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Expedicao() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/logistica")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Expedição</h1>
            <p className="text-sm text-muted-foreground">Gerenciar ordens de carregamento</p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="p-4 pb-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Truck className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Módulo de Expedição
          </h2>
          <p className="text-muted-foreground max-w-md">
            As ordens de carregamento são geradas diretamente nos pedidos quando estão nas etapas
            "Aguardando Coleta" ou "Aguardando Instalação".
          </p>
          <Button 
            onClick={() => navigate("/pedidos")}
            className="mt-6"
          >
            Ir para Pedidos
          </Button>
        </div>
      </main>
    </div>
  );
}
