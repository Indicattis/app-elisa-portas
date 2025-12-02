import { useState } from "react";
import { useOrdensProducao } from "@/hooks/useOrdensProducao";
import { OrdensAccordion } from "@/components/ordens/OrdensAccordion";
import { OrdensFiltros } from "@/components/ordens/OrdensFiltros";
import { FileText, Loader2, Clock, Play, FolderOpen, AlertTriangle } from "lucide-react";
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
  
  // Ordens pendentes: sem responsável
  const ordensPendentes = pedidos.flatMap(p => p.ordens)
    .filter(o => !o.responsavel_id).length;

  // Ordens em produção: com responsável mas não concluídas
  const ordensEmProducao = pedidos.flatMap(p => p.ordens)
    .filter(o => o.responsavel_id && !o.historico).length;

  // Pedidos em aberto: não em backlog
  const pedidosEmAberto = pedidos.filter(p => !p.em_backlog).length;

  // Pedidos em backlog
  const pedidosBacklog = pedidos.filter(p => p.em_backlog).length;

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pedidos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Ordens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdens}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{ordensPendentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Play className="h-3 w-3" />
              Em Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{ordensEmProducao}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              Ped. Abertos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{pedidosEmAberto}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Backlog
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{pedidosBacklog}</div>
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
