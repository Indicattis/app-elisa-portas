import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, DoorOpen, GripVertical, Hammer, Truck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { VendaPendentePedido } from "@/hooks/useVendasPendentePedido";
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

  // Grid: drag | avatar | nome | cidade | tempo | entrega | cores | pagamento | valor | seta
  // Matching PedidoCard column sizes
  return (
    <TooltipProvider>
      <Card
        className={`hover:shadow-sm transition-all cursor-pointer h-10 overflow-hidden ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
        onClick={() => navigate(`/administrativo/financeiro/faturamento/${venda.id}?from=vendas`)}
      >
        <CardContent className="p-0 h-full">
          <div
            className="grid items-center gap-1.5 h-full px-2 w-full"
            style={{ gridTemplateColumns: '20px 24px 180px 100px 50px 50px 50px 65px 80px 65px 65px 20px' }}
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

            {/* Tipo entrega icon - matching PedidoCard style */}
            <div className="flex items-center justify-center gap-1">
              {tipoEntregaIcon ? (
                <Badge variant="outline" className={`text-[10px] px-1 py-0 h-5 ${tipoEntregaIcon.className}`}>
                  <tipoEntregaIcon.icon className="h-2.5 w-2.5" />
                </Badge>
              ) : (
                <span className="text-gray-300 text-[10px]">—</span>
              )}
            </div>

            {/* Cores - matching PedidoCard pill style */}
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

            {/* Seta */}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
