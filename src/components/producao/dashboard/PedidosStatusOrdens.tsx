import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePedidosComOrdens, PedidoComOrdens } from "@/hooks/usePedidosComOrdens";
import { 
  Hammer, Package, Boxes, Sparkles, CheckSquare, User, AlertCircle, 
  ChevronLeft, ChevronRight, AlertTriangle, PauseCircle, RefreshCw 
} from "lucide-react";
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
import { PedidoOrdensModal } from "./PedidoOrdensModal";
import { cn } from "@/lib/utils";

// Parse tamanho string like "3,50x2,80" into numbers
const parseTamanhoString = (tamanhoStr: string | null): { largura: number; altura: number } => {
  if (!tamanhoStr) return { largura: 0, altura: 0 };
  const normalizado = tamanhoStr.replace(/,/g, '.');
  const partes = normalizado.toLowerCase().split('x');
  if (partes.length === 2) {
    const largura = parseFloat(partes[0]) || 0;
    const altura = parseFloat(partes[1]) || 0;
    return { largura, altura };
  }
  return { largura: 0, altura: 0 };
};

interface PortaInfo {
  tamanho: 'P' | 'G';
  largura: number;
  altura: number;
  area: number;
}

const ITEMS_PER_PAGE = 11;

const ordemIcons = {
  soldagem: Hammer,
  perfiladeira: Package,
  separacao: Boxes,
  qualidade: Sparkles,
  pintura: CheckSquare,
};

const ordemLabels = {
  soldagem: "Soldagem",
  perfiladeira: "Perfiladeira",
  separacao: "Separação",
  qualidade: "Qualidade",
  pintura: "Pintura",
};

export function PedidosStatusOrdens() {
  const { data: pedidos = [], isLoading, refetch, isFetching } = usePedidosComOrdens();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPedido, setSelectedPedido] = useState<PedidoComOrdens | null>(null);

  const totalPages = Math.ceil(pedidos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPedidos = pedidos.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-1 px-3 pt-3">
          <CardTitle className="text-sm">Pedidos em Produção</CardTitle>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pedidos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos em Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum pedido em produção no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBorder = (status: string | null, pausada: boolean) => {
    if (pausada) {
      return "border-2 border-orange-500";
    }
    switch (status) {
      case "concluido":
      case "pronta":
        return "border border-green-500";
      case "em_andamento":
        return "border-2 border-yellow-500";
      case "pendente":
        return "border-2 border-gray-400";
      default:
        return "border-2 border-gray-300";
    }
  };

  // Helper to get pause warnings for a pedido
  const getPauseWarnings = (ordens: typeof pedidos[0]["ordens"]) => {
    const warnings: { tipo: string; justificativa: string | null }[] = [];
    
    Object.entries(ordens).forEach(([key, ordem]) => {
      if (ordem.existe && ordem.pausada) {
        warnings.push({
          tipo: ordemLabels[key as keyof typeof ordemLabels],
          justificativa: ordem.justificativa_pausa || null,
        });
      }
    });
    
    return warnings;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Card>
        <CardHeader className="pb-1 px-3 pt-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Pedidos com Ordens Pendentes</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Atualizar listagem</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent className="pb-2 px-3">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="h-6 text-[10px] py-0.5 px-2">Pedido</TableHead>
                  <TableHead className="h-6 text-[10px] py-0.5 px-2">Cliente</TableHead>
                  <TableHead className="h-6 text-[10px] py-0.5 px-2 text-center">Portas</TableHead>
                  <TableHead className="h-6 text-[10px] py-0.5 px-2">Entrega</TableHead>
                  <TableHead className="h-6 text-[10px] py-0.5 px-2">Carregamento</TableHead>
                  <TableHead className="h-6 text-[10px] py-0.5 px-2">Etapa</TableHead>
                  <TableHead className="h-6 text-[10px] py-0.5 px-2 text-center">Avisos</TableHead>
                  {Object.entries(ordemLabels).map(([key, label]) => (
                    <TableHead key={key} className="text-center h-6 text-[10px] py-0.5 px-1">
                      {label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPedidos.map((pedido) => {
                  const warnings = getPauseWarnings(pedido.ordens);
                  
                  // Build list of doors with P/G classification
                  const portasEnrolar = pedido.produtos?.filter(p => p.tipo === 'porta_enrolar') || [];
                  const listaPortasInfo: PortaInfo[] = [];
                  
                  portasEnrolar.forEach(p => {
                    let largura = p.largura || 0;
                    let altura = p.altura || 0;
                    
                    // Fallback: try to extract from tamanho field
                    if (largura === 0 && altura === 0 && p.tamanho) {
                      const parsed = parseTamanhoString(p.tamanho);
                      largura = parsed.largura;
                      altura = parsed.altura;
                    }
                    
                    const area = largura * altura;
                    const categoria: 'P' | 'G' = area > 25 ? 'G' : 'P';
                    const quantidade = p.quantidade || 1;
                    
                    for (let i = 0; i < quantidade; i++) {
                      listaPortasInfo.push({ tamanho: categoria, largura, altura, area });
                    }
                  });
                  
                  const portasPequenas = listaPortasInfo.filter(p => p.tamanho === 'P').length;
                  const portasGrandes = listaPortasInfo.filter(p => p.tamanho === 'G').length;
                  
                  return (
                    <TableRow 
                      key={pedido.numero_pedido} 
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedPedido(pedido)}
                    >
                      <TableCell className="font-medium text-[11px] py-1 px-2">
                        {pedido.numero_mes ? `#${pedido.numero_mes}` : pedido.numero_pedido}
                      </TableCell>
                      <TableCell className="text-[11px] py-1 px-2">
                        {pedido.nome_cliente}
                      </TableCell>
                      <TableCell className="text-center py-1 px-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {listaPortasInfo.length > 0 ? (
                            <>
                              {listaPortasInfo.slice(0, 6).map((porta, idx) => (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-[9px] px-1 py-0 h-4 text-white cursor-default",
                                          porta.tamanho === 'P' 
                                            ? "bg-blue-500 border-blue-500"
                                            : "bg-orange-500 border-orange-500"
                                        )}
                                      >
                                        {porta.tamanho}
                                      </Badge>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{porta.largura.toFixed(2)}m × {porta.altura.toFixed(2)}m</p>
                                    <p className="text-xs text-muted-foreground">{porta.area.toFixed(2)} m²</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              {listaPortasInfo.length > 6 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-[9px] text-muted-foreground cursor-help">+{listaPortasInfo.length - 6}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{portasPequenas} porta(s) pequena(s) (≤25m²)</p>
                                    <p>{portasGrandes} porta(s) grande(s) (&gt;25m²)</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-300 text-[10px]">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] py-1 px-2">
                        {pedido.data_entrega ? new Date(pedido.data_entrega).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="text-[11px] py-1 px-2">
                        {pedido.data_carregamento ? new Date(pedido.data_carregamento).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell className="py-1 px-2">
                        <Badge variant="outline" className="text-[8px] px-1 py-0">
                          {pedido.etapa_atual}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-1 px-2">
                        {warnings.length > 0 ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Badge 
                                  variant="destructive" 
                                  className="text-[9px] px-1.5 py-0 cursor-help bg-orange-500 hover:bg-orange-600"
                                >
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                  {warnings.length}
                                </Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs">
                              <div className="space-y-1.5">
                                <p className="font-semibold text-xs">Ordens Pausadas:</p>
                                {warnings.map((w, idx) => (
                                  <div key={idx} className="text-xs">
                                    <span className="font-medium">{w.tipo}:</span>{" "}
                                    <span className="text-muted-foreground">
                                      {w.justificativa || "Sem justificativa"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </TableCell>
                      {Object.entries(ordemIcons).map(([key]) => {
                        const ordem = pedido.ordens?.[key as keyof typeof pedido.ordens];
                        return (
                          <TableCell key={key} className="text-center py-1 px-1">
                            {ordem?.existe ? (
                              <div className="flex flex-col items-center">
                                {ordem.pausada ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className={`h-5 w-5 rounded-full ${getStatusBorder(ordem.status, ordem.pausada)} bg-orange-500/10 flex items-center justify-center cursor-help`}>
                                        <PauseCircle className="h-3 w-3 text-orange-600" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs font-medium">Pausada</p>
                                      {ordem.justificativa_pausa && (
                                        <p className="text-xs text-muted-foreground">{ordem.justificativa_pausa}</p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : ordem.capturada && ordem.capturada_por_foto ? (
                                  <Avatar className={`h-5 w-5 ${getStatusBorder(ordem.status, false)}`}>
                                    <AvatarImage src={ordem.capturada_por_foto} />
                                    <AvatarFallback className="text-[8px]">
                                      <User className="h-2.5 w-2.5" />
                                    </AvatarFallback>
                                  </Avatar>
                                ) : ordem.capturada ? (
                                  <div className={`h-5 w-5 rounded-full ${getStatusBorder(ordem.status, false)} bg-secondary flex items-center justify-center`}>
                                    <User className="h-2.5 w-2.5" />
                                  </div>
                                ) : (
                                  <div className="h-5 w-5 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                    <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300 text-[10px]">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-2 border-t mt-2">
              <div className="text-[10px] text-muted-foreground">
                Mostrando {startIndex + 1}-{Math.min(endIndex, pedidos.length)} de {pedidos.length} pedidos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 text-[10px]"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Anterior
                </Button>
                <span className="text-[10px] text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 text-[10px]"
                >
                  Próximo
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PedidoOrdensModal
        pedido={selectedPedido}
        open={!!selectedPedido}
        onOpenChange={(open) => !open && setSelectedPedido(null)}
      />
    </TooltipProvider>
  );
}
