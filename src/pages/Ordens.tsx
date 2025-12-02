import { useState } from "react";
import { useOrdensProducao } from "@/hooks/useOrdensProducao";
import { OrdensAccordion } from "@/components/ordens/OrdensAccordion";
import { OrdensFiltros } from "@/components/ordens/OrdensFiltros";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Ordens() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [tipoOrdem, setTipoOrdem] = useState("todos");

  const { data: pedidos = [], isLoading } = useOrdensProducao({
    search,
    status: status === "todos" ? "" : status,
    tipoOrdem: tipoOrdem === "todos" ? "" : tipoOrdem,
  });

  const handleReset = () => {
    setSearch("");
    setStatus("todos");
    setTipoOrdem("todos");
  };

  const totalOrdens = pedidos.reduce((acc, p) => acc + p.total_ordens, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Ordens de Produção
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as ordens de produção agrupadas por pedido
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Ordens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdens}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Média por Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pedidos.length > 0 ? (totalOrdens / pedidos.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      <OrdensFiltros
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        tipoOrdem={tipoOrdem}
        onTipoOrdemChange={setTipoOrdem}
        onReset={handleReset}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <OrdensAccordion pedidos={pedidos} />
      )}
    </div>
  );
}
