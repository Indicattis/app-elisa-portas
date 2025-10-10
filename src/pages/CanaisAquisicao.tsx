import { CanaisAquisicaoManager } from "@/components/CanaisAquisicaoManager";
import { Database } from "lucide-react";

export default function CanaisAquisicao() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Database className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Canais de Aquisição</h1>
          <p className="text-muted-foreground">
            Gerencie os canais de aquisição de clientes
          </p>
        </div>
      </div>

      <CanaisAquisicaoManager />
    </div>
  );
}
