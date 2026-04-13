import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronRight, GripVertical, Hammer, Truck, Wrench, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { VendaPendentePedido } from "@/hooks/useVendasPendentePedido";
import { usePedidoCreation } from "@/hooks/usePedidoCreation";
import { formatCurrency } from "@/lib/utils";

interface VendaPendentePedidoCardProps {
  venda: VendaPendentePedido;
  dragHandleProps?: any;
  isDragging?: boolean;
}

const FORMAS_PAGAMENTO_LABELS: Record<string, string> = {
  boleto: "Boleto",
  a_vista: "À Vista",
  cartao_credito: "Cartão",
  dinheiro: "Dinheiro",
  avista: "À Vista",
  credito: "Cartão",
};

const isAcoGalvanizado = (corNome: string) => {
  const normalized = corNome.toLowerCase().trim();
  return normalized.includes('aço') || normalized.includes('aco') || normalized.includes('galvanizado');
};

export function VendaPendentePedidoCard({ venda, dragHandleProps, isDragging }: VendaPendentePedidoCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createPedidoFromVenda } = usePedidoCreation();
  const [isCreating, setIsCreating] = useState(false);

  const atendenteIniciais = venda.atendente_nome
    ? venda.atendente_nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const valorTotal = (venda.valor_venda || 0) + (venda.valor_credito || 0);
  const diasPendente = differenceInDays(new Date(), new Date(venda.data_venda));
  const pagamentoLabel = venda.metodo_pagamento ? (FORMAS_PAGAMENTO_LABELS[venda.metodo_pagamento] || venda.metodo_pagamento) : null;

  const tipoEntregaIcon = (() => {
    if (!venda.tipo_entrega) return null;
    const tipo = venda.tipo_entrega.toLowerCase();
    if (tipo.includes('instalacao') || tipo.includes('instalação')) {
      return { icon: Hammer, label: 'Instalação', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/50' };
    }
    if (tipo.includes('entrega')) {
      return { icon: Truck, label: 'Entrega', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/50' };
    }
    if (tipo.includes('manutencao') || tipo.includes('manutenção')) {
      return { icon: Wrench, label: 'Manutenção', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/50' };
    }
    return null;
  })();

  const handleCriarPedido = async () => {
    setIsCreating(true);
    try {
      const pedidoId = await createPedidoFromVenda(venda.id);
      if (pedidoId) {
        queryClient.invalidateQueries({ queryKey: ["vendas-pendente-pedido"] });
        queryClient.invalidateQueries({ queryKey: ["pedidos-etapas"] });
        queryClient.invalidateQueries({ queryKey: ["pedidos-contadores"] });
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <TooltipProvider>
      <Card
        className={`hover:shadow-sm transition-all cursor-pointer h-10 overflow-hidden ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
        onClick={() => navigate(`/administrativo/financeiro/faturamento/${venda.id}?from=vendas`)}
      >
        <CardContent className="p-0 h-full">
          <div
            className="grid items-center gap-1.5 h-full px-2 w-full"
            style={{ gridTemplateColumns: '20px 24px 180px 100px 50px 50px 50px 65px 80px 65px 65px 55px 20px' }}
          >
            {/* Drag handle */}
            <div
              {...dragHandleProps}
              className="flex items-center justify-center cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Avatar atendente */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={venda.atendente_foto_url || undefined} />
                  <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                    {atendenteIniciais}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Vendedor: {venda.atendente_nome || 'Sem atendente'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Nome cliente */}
            <div className="min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-semibold text-sm truncate">
                    {venda.cliente_nome && venda.cliente_nome.length > 20
                      ? `${venda.cliente_nome.substring(0, 20)}...`
                      : venda.cliente_nome || "Cliente não informado"}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{venda.cliente_nome || "Cliente não informado"}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Cidade/Estado */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center text-center">
                  {venda.cidade || venda.estado ? (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {venda.cidade && venda.estado
                        ? `${venda.cidade}/${venda.estado}`
                        : venda.cidade || venda.estado}
                    </span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/50">—</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {venda.cidade && venda.estado
                    ? `${venda.cidade}, ${venda.estado}`
                    : venda.cidade || venda.estado || 'Localização não informada'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Tempo pendente */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1 py-0 h-5 justify-center ${
                    diasPendente > 14 ? 'border-red-500/50 text-red-400' :
                    diasPendente > 7 ? 'border-yellow-500/50 text-yellow-400' :
                    'border-muted text-muted-foreground'
                  }`}
                >
                  {diasPendente}d
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{diasPendente} dias pendente (desde {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })})</p>
              </TooltipContent>
            </Tooltip>

            {/* Tipo entrega icon */}
            <div className="flex items-center justify-center gap-1">
              {tipoEntregaIcon ? (
                <Badge variant="outline" className={`text-[10px] px-1 py-0 h-5 ${tipoEntregaIcon.className}`}>
                  <tipoEntregaIcon.icon className="h-2.5 w-2.5" />
                </Badge>
              ) : (
                <span className="text-gray-300 text-[10px]">—</span>
              )}
            </div>

            {/* Portas P/G */}
            <div className="flex items-center gap-0.5 overflow-hidden">
              {venda.portas_info.length > 0 ? (
                <>
                  {venda.portas_info.slice(0, 6).map((porta, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] px-1 py-0 h-4 text-white cursor-default",
                            porta.tamanho === 'P'
                              ? "bg-blue-500 border-blue-500"
                              : "bg-orange-500 border-orange-500"
                          )}
                          onMouseEnter={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {porta.tamanho}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="z-[100]">
                        <p className="font-medium">{porta.largura.toFixed(2)}m × {porta.altura.toFixed(2)}m</p>
                        <p className="text-xs text-muted-foreground">{porta.area.toFixed(2)} m²</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {venda.portas_info.length > 6 && (
                    <span className="text-[9px] text-muted-foreground">+{venda.portas_info.length - 6}</span>
                  )}
                </>
              ) : (
                <span className="text-gray-300 text-[10px]">—</span>
              )}
            </div>

            {/* Cores */}
            <div className="flex items-center gap-1">
              {venda.cores.length > 0 ? (
                <>
                  {venda.cores.slice(0, 2).map((cor, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div
                          className="h-5 flex-1 border border-border"
                          style={{
                            backgroundColor: isAcoGalvanizado(cor.nome) ? 'transparent' : cor.codigo_hex,
                            borderRadius: '20px'
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{cor.nome}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {venda.cores.length > 2 && (
                    <span className="text-[9px] text-muted-foreground">+{venda.cores.length - 2}</span>
                  )}
                </>
              ) : (
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 bg-gray-200/20 text-gray-500 border-gray-400/30">
                  Galvanizada
                </Badge>
              )}
            </div>

            {/* Forma pagamento */}
            <div className="text-center">
              {pagamentoLabel ? (
                <span className="text-[10px] text-muted-foreground truncate">{pagamentoLabel}</span>
              ) : (
                <span className="text-[9px] text-muted-foreground/50">—</span>
              )}
            </div>

            {/* Valor da Venda */}
            <div className="text-center">
              <span className="text-[10px] text-muted-foreground">
                {formatCurrency(venda.valor_venda || 0)}
              </span>
            </div>

            {/* Valor Total (com crédito) */}
            <div className="text-center">
              <span className="text-[10px] font-medium text-muted-foreground">
                {formatCurrency(valorTotal)}
              </span>
            </div>

            {/* Criar Pedido */}
            <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        disabled={isCreating}
                        className="flex h-[20px] w-full rounded-[3px]"
                      >
                        {isCreating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Criar Pedido de Produção</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Criar Pedido de Produção</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deseja criar um pedido de produção para esta venda?
                      <br />
                      Cliente: <strong>{venda.cliente_nome}</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCriarPedido}>
                      Criar Pedido
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Seta */}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
