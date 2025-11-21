import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstalacaoForm } from "@/components/instalacoes/InstalacaoForm";
import { useInstalacoes } from "@/hooks/useInstalacoes";
import { InstalacaoFormData } from "@/types/instalacao";
import { format } from "date-fns";

export default function InstalacoesNovas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createInstalacao, isCreating } = useInstalacoes();
  
  const [initialData, setInitialData] = useState<Partial<InstalacaoFormData>>({});

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      setInitialData({
        data: dataParam,
        hora: "08:00",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (data: InstalacaoFormData) => {
    try {
      await createInstalacao(data);
      navigate("/instalacoes");
    } catch (error) {
      console.error("Erro ao criar instalação:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fixo */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/instalacoes")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Nova Instalação</h1>
            <p className="text-sm text-muted-foreground">Cadastrar nova instalação</p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="p-4 pb-8 max-w-2xl mx-auto">
        <InstalacaoForm
          onSubmit={handleSubmit}
          initialData={initialData}
          isLoading={isCreating}
        />
      </main>
    </div>
  );
}
