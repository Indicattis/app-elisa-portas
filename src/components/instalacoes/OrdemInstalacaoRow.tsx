import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Truck, MapPin, Wrench, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OrdemInstalacao } from "@/hooks/useOrdensInstalacao";
import { cn } from "@/lib/utils";
import { getFormaPagamentoLabel } from "@/utils/formatters";

interface OrdemInstalacaoRowProps {
  ordem: OrdemInstalacao;
  onConcluir?: (ordem: OrdemInstalacao) => void;
  isConcluindo: boolean;
  showCarregador?: boolean;
  onClick?: (ordem: OrdemInstalacao) => void;
}

// Calcular badges de tamanho baseado na área
const calcularBadgesPorta = (produtos: Array<{
  tipo_produto: string;
  largura: number | null;
  altura: number | null;
  quantidade: number;
}> | undefined) => {
  const contagem = { P: 0, G: 0, GG: 0 };
  
  if (!produtos) return contagem;
  
  produtos
    .filter(p => p.tipo_produto === 'porta_enrolar')
    .forEach(p => {
      const area = (p.largura || 0) * (p.altura || 0);
      const qtd = p.quantidade || 1;
      
      if (area > 50) contagem.GG += qtd;
      else if (area > 25) contagem.G += qtd;
      else contagem.P += qtd;
    });
  
  return contagem;
};

// Formatar valor
const formatarValor = (valor: number | null | undefined): string => {
  if (!valor) return "—";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

export function OrdemInstalacaoRow({ 
  ordem, 
  onConcluir, 
  isConcluindo,
  showCarregador = false,
  onClick 
}: OrdemInstalacaoRowProps) {
  const clienteNome = ordem.venda?.cliente_nome || ordem.nome_cliente;
  const cidade = ordem.venda?.cidade || ordem.cidade;
  const estado = ordem.venda?.estado || ordem.estado;
  const valorVenda = ordem.venda?.valor_venda;
  const metodoPagamento = ordem.venda?.metodo_pagamento;
  const badges = calcularBadgesPorta(ordem.venda?.produtos);
  
  // Verificar se está atrasado
  const isAtrasado = (): boolean => {
    if (!ordem.data_instalacao) return false;
    const dataInstalacao = new Date(ordem.data_instalacao);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataInstalacao.setHours(0, 0, 0, 0);
    return dataInstalacao < hoje;
  };
  
  const atrasado = isAtrasado();
  const isCorrecao = ordem.tipo_ordem === 'correcao';
  
  return (
    <div 
      className={cn(
        "h-[35px] grid items-center gap-2 px-3 rounded-md border border-l-4 bg-card/50 text-sm transition-colors hover:bg-muted/50",
        isCorrecao
          ? "border-l-purple-500"
          : "border-l-blue-500",
        atrasado && "border-red-500/50 bg-red-500/5",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(ordem)}
      style={{ 
        gridTemplateColumns: "28px 86px 70px 1fr 100px 60px 80px 80px 50px" 
      }}
    >
      {/* Avatar */}
      <div className="flex items-center justify-center">
        {showCarregador && ordem.carregador ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6">
                <AvatarImage src={ordem.carregador.foto_perfil_url || undefined} />
                <AvatarFallback className="text-[10px] bg-green-500/20 text-green-600">
                  {ordem.carregador.nome.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              Carregado por {ordem.carregador.nome}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <Truck className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent>Aguardando carregamento</TooltipContent>
          </Tooltip>
        )}
      </div>
      
      {/* Tipo: Instalação x Correção */}
      <div className="flex items-center">
        {isCorrecao ? (
          <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-purple-500/20 text-purple-600 border-purple-500/40 hover:bg-purple-500/20">
            <Wrench className="h-3 w-3" />
            Correção
          </Badge>
        ) : (
          <Badge className="h-5 px-1.5 text-[10px] gap-1 bg-blue-500/20 text-blue-600 border-blue-500/40 hover:bg-blue-500/20">
            <Hammer className="h-3 w-3" />
            Instalação
          </Badge>
        )}
      </div>

      {/* Número do Pedido */}
      <div className="flex items-center">
        <Badge variant="outline" className="font-mono text-xs h-5 px-1.5">
          #{ordem.pedido?.numero_pedido || "—"}
        </Badge>
      </div>
      
      {/* Cliente */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate">{clienteNome}</span>
        {atrasado && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1">
            Atrasado
          </Badge>
        )}
      </div>
      
      {/* Cidade/Estado */}
      <div className="flex items-center gap-1 text-muted-foreground text-xs truncate">
        <MapPin className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {cidade && estado ? `${cidade}/${estado}` : cidade || estado || "—"}
        </span>
      </div>
      
      {/* Badges P/G/GG */}
      <div className="flex items-center gap-1">
        {badges.P > 0 && (
          <Badge 
            variant="outline" 
            className="h-5 px-1.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-600 border-cyan-500/50"
          >
            {badges.P}P
          </Badge>
        )}
        {badges.G > 0 && (
          <Badge 
            variant="outline" 
            className="h-5 px-1.5 text-[10px] font-bold bg-purple-500/20 text-purple-600 border-purple-500/50"
          >
            {badges.G}G
          </Badge>
        )}
        {badges.GG > 0 && (
          <Badge 
            variant="outline" 
            className="h-5 px-1.5 text-[10px] font-bold bg-orange-500/20 text-orange-600 border-orange-500/50"
          >
            {badges.GG}GG
          </Badge>
        )}
        {badges.P === 0 && badges.G === 0 && badges.GG === 0 && (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </div>
      
      {/* Pagamento */}
      <div className="flex items-center">
        <span className="text-xs text-muted-foreground truncate">
          {getFormaPagamentoLabel(metodoPagamento)}
        </span>
      </div>
      
      {/* Valor */}
      <div className="flex items-center justify-end">
        <span className="text-xs font-medium text-emerald-600">
          {formatarValor(valorVenda)}
        </span>
      </div>
      
      {/* Botão de Ação */}
      <div className="flex items-center justify-end">
        {onConcluir && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onConcluir(ordem); }}
                disabled={isConcluindo}
                className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-500/10"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Concluir instalação</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
