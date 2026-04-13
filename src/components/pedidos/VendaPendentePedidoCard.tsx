import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, DoorOpen, GripVertical, Hammer, Truck, MapPin, Wrench } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { VendaPendentePedido } from "@/hooks/useVendasPendentePedido";

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
      return { icon: Hammer, label: 'Instalação', className: 'bg-blue-500/20 text-blue-400' };
    }
    if (tipo.includes('entrega')) {
      return { icon: Truck, label: 'Entrega', className: 'bg-green-500/20 text-green-400' };
    }
    if (tipo.includes('manutencao') || tipo.includes('manutenção')) {
      return { icon: Wrench, label: 'Manutenção', className: 'bg-orange-500/20 text-orange-400' };
    }
    return null;
  })();

  return (
    <TooltipProvider>
      <Card
        className={`hover:shadow-sm transition-all cursor-pointer h-10 overflow-hidden ${isDragging ? 'opacity-50 shadow-2xl' : ''}`}
        onClick={() => navigate(`/administrativo/financeiro/faturamento/${venda.id}?from=vendas`)}
      >
        <CardContent className="p-0 h-full">
          <div
            className="grid items-center gap-1.5 h-full px-2 w-full"
            style={{ gridTemplateColumns: '20px 24px 1fr 80px 50px 30px 60px 65px 100px 20px' }}
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
                  <AvatarFallback className="text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/50">
                    {atendenteIniciais}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{venda.atendente_nome || 'Sem atendente'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Nome cliente */}
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm font-medium truncate">
                  {venda.cliente_nome || "Cliente não informado"}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{venda.cliente_nome || "Cliente não informado"}</p>
              </TooltipContent>
            </Tooltip>

            {/* Cidade/Estado */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {venda.cidade ? `${venda.cidade}/${venda.estado || ''}` : '-'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{venda.cidade ? `${venda.cidade} - ${venda.estado || ''}` : 'Sem localização'}</p>
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
            {tipoEntregaIcon ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center justify-center h-5 w-5 rounded ${tipoEntregaIcon.className}`}>
                    <tipoEntregaIcon.icon className="h-3 w-3" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{tipoEntregaIcon.label}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <div />
            )}

            {/* Cores */}
            <div className="flex items-center gap-0.5 justify-center">
              {venda.cores.slice(0, 3).map((cor) => (
                <Tooltip key={cor.nome}>
                  <TooltipTrigger asChild>
                    <div
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: cor.codigo_hex }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{cor.nome}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {venda.cores.length === 0 && <div />}
            </div>

            {/* Forma pagamento */}
            {pagamentoLabel ? (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-5 justify-center truncate">
                {pagamentoLabel}
              </Badge>
            ) : (
              <div />
            )}

            {/* Valor */}
            <span className="text-sm font-semibold text-right">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}
            </span>

            {/* Seta */}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
