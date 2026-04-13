import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, DoorOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { VendaPendentePedido } from "@/hooks/useVendasPendentePedido";

interface VendaPendentePedidoCardProps {
  venda: VendaPendentePedido;
}

export function VendaPendentePedidoCard({ venda }: VendaPendentePedidoCardProps) {
  const navigate = useNavigate();

  const atendenteIniciais = venda.atendente_nome
    ? venda.atendente_nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const valorTotal = (venda.valor_venda || 0) + (venda.valor_credito || 0);

  return (
    <TooltipProvider>
      <Card
        className="hover:shadow-sm transition-all cursor-pointer h-10 overflow-hidden"
        onClick={() => navigate(`/administrativo/financeiro/faturamento/${venda.id}?from=vendas`)}
      >
        <CardContent className="p-0 h-full">
          <div
            className="grid items-center gap-1.5 h-full px-2 w-full"
            style={{ gridTemplateColumns: '24px 1fr 90px 60px 100px 20px' }}
          >
            {/* Avatar atendente */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-5 w-5">
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

            {/* Data venda */}
            <span className="text-xs text-muted-foreground text-center">
              {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
            </span>

            {/* Qtd portas */}
            {venda.quantidade_portas > 0 ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 flex items-center gap-0.5 justify-center">
                <DoorOpen className="h-3 w-3" />
                {venda.quantidade_portas}
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
