import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ConfiguracoesFiscaisForm } from "@/components/notas-fiscais/ConfiguracoesFiscaisForm";

export default function ConfiguracoesFiscais() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/administrativo/financeiro/notas-fiscais')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configurações Fiscais</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configure os dados fiscais da empresa para emissão de notas
            </p>
          </div>
        </div>
      </div>

      <ConfiguracoesFiscaisForm />
    </div>
  );
}
