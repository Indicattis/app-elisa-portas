import { useState } from "react";
import { useChamadosSuporte } from "@/hooks/useChamadosSuporte";
import { ChamadosFilters } from "@/types/suporte";
import { ChamadosIndicadores } from "@/components/suporte/ChamadosIndicadores";
import { ChamadosFilters as FiltersComponent } from "@/components/suporte/ChamadosFilters";
import { ChamadosTable } from "@/components/suporte/ChamadosTable";

export default function Suporte() {
  const [filters, setFilters] = useState<ChamadosFilters>({});
  const { chamados, isLoading, updateNotas, updateStatus, deleteChamado, contadores } =
    useChamadosSuporte(filters);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Suporte</h1>
      </div>

      {/* Indicadores */}
      <ChamadosIndicadores contadores={contadores} />

      {/* Filtros */}
      <FiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Tabela de Chamados */}
      {chamados.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">Nenhum chamado encontrado</p>
        </div>
      ) : (
        <ChamadosTable
          chamados={chamados}
          onUpdateNotas={(data) => updateNotas.mutate(data)}
          onUpdateStatus={(data) => updateStatus.mutate(data)}
          onDeleteChamado={(id) => deleteChamado.mutate(id)}
        />
      )}
    </div>
  );
}
