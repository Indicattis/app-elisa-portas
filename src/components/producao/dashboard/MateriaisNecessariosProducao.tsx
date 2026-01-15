import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Package, RefreshCw, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { useMateriaisNecessariosProducao, MaterialNecessario } from "@/hooks/useMateriaisNecessariosProducao";

type StatusFilter = "todos" | "critico" | "baixo" | "ok";

function getStatus(material: MaterialNecessario): "critico" | "baixo" | "ok" {
  if (material.estoque_atual < material.quantidade_necessaria) return "critico";
  if (material.estoque_atual < material.quantidade_necessaria * 2) return "baixo";
  return "ok";
}

function StatusBadge({ status }: { status: "critico" | "baixo" | "ok" }) {
  switch (status) {
    case "critico":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Crítico
        </Badge>
      );
    case "baixo":
      return (
        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600 bg-yellow-50">
          <AlertTriangle className="h-3 w-3" />
          Baixo
        </Badge>
      );
    case "ok":
      return (
        <Badge variant="outline" className="gap-1 border-green-500 text-green-600 bg-green-50">
          <CheckCircle2 className="h-3 w-3" />
          OK
        </Badge>
      );
  }
}

export function MateriaisNecessariosProducao() {
  const { data: materiais, isLoading, refetch, isFetching } = useMateriaisNecessariosProducao();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [page, setPage] = useState(0);
  const itemsPerPage = 8;

  const materiaisFiltrados = materiais?.filter((m) => {
    if (statusFilter === "todos") return true;
    return getStatus(m) === statusFilter;
  }) || [];

  const totalPages = Math.ceil(materiaisFiltrados.length / itemsPerPage);
  const materiaisPaginados = materiaisFiltrados.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  );

  const contagem = {
    critico: materiais?.filter((m) => getStatus(m) === "critico").length || 0,
    baixo: materiais?.filter((m) => getStatus(m) === "baixo").length || 0,
    ok: materiais?.filter((m) => getStatus(m) === "ok").length || 0,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Materiais Necessários para Produção</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        
        {/* Filtros de status */}
        <div className="flex gap-2 mt-2">
          <Button
            variant={statusFilter === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter("todos"); setPage(0); }}
          >
            Todos ({materiais?.length || 0})
          </Button>
          <Button
            variant={statusFilter === "critico" ? "destructive" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter("critico"); setPage(0); }}
            className={statusFilter !== "critico" ? "border-red-300 text-red-600 hover:bg-red-50" : ""}
          >
            Crítico ({contagem.critico})
          </Button>
          <Button
            variant={statusFilter === "baixo" ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter("baixo"); setPage(0); }}
            className={statusFilter === "baixo" ? "bg-yellow-500 hover:bg-yellow-600" : "border-yellow-300 text-yellow-600 hover:bg-yellow-50"}
          >
            Baixo ({contagem.baixo})
          </Button>
          <Button
            variant={statusFilter === "ok" ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter("ok"); setPage(0); }}
            className={statusFilter === "ok" ? "bg-green-500 hover:bg-green-600" : "border-green-300 text-green-600 hover:bg-green-50"}
          >
            OK ({contagem.ok})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : materiaisFiltrados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {statusFilter === "todos" 
              ? "Nenhum material vinculado aos pedidos em produção"
              : `Nenhum material com status "${statusFilter}"`}
          </div>
        ) : (
          <>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Qtd Necessária</TableHead>
                    <TableHead className="text-right">Metragem</TableHead>
                    <TableHead className="text-right">Estoque Atual</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiaisPaginados.map((material) => {
                    const status = getStatus(material);
                    const deficit = material.quantidade_necessaria - material.estoque_atual;
                    
                    return (
                      <TableRow key={material.estoque_id}>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium cursor-help">
                                {material.nome_produto}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Usado em {material.ocorrencias} linha(s) de pedido</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {material.quantidade_necessaria.toLocaleString("pt-BR")}
                          {material.unidade && (
                            <span className="text-muted-foreground text-xs ml-1">
                              {material.unidade}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {material.metragem_total > 0 ? (
                            <>
                              {material.metragem_total.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              <span className="text-muted-foreground text-xs ml-1">m²</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={status === "critico" ? "text-red-600 font-bold" : ""}>
                                {material.estoque_atual.toLocaleString("pt-BR")}
                              </span>
                            </TooltipTrigger>
                            {status === "critico" && (
                              <TooltipContent>
                                <p>Faltam {deficit.toLocaleString("pt-BR")} unidades</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Mostrando {page * itemsPerPage + 1}-
                  {Math.min((page + 1) * itemsPerPage, materiaisFiltrados.length)} de{" "}
                  {materiaisFiltrados.length} materiais
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
