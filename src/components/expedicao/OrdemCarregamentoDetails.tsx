import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Calendar, Clock, User, Phone, Truck, DoorOpen, CreditCard, FileText, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getFormaPagamentoLabel } from "@/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface OrdemCarregamentoDetailsProps {
  ordem: OrdemCarregamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrdemCarregamentoDetails = ({
  ordem,
  open,
  onOpenChange,
}: OrdemCarregamentoDetailsProps) => {
  if (!ordem) return null;

  const getStatusConfig = (status: string | null) => {
    const configs: Record<string, { label: string; className: string }> = {
      pendente: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
      agendada: { label: "Agendada", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
      em_carregamento: { label: "Em Carregamento", className: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
      concluida: { label: "Concluída", className: "bg-green-500/20 text-green-300 border-green-500/30" },
      pronta_fabrica: { label: "Pronta Fábrica", className: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
    };
    return configs[status || 'pendente'] || configs.pendente;
  };

  const getTipoEntregaConfig = (tipo: string | null | undefined) => {
    if (tipo === 'instalacao') {
      return { label: "Instalação", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    }
    return { label: "Entrega", className: "bg-sky-500/20 text-sky-300 border-sky-500/30" };
  };

  const formatTamanho = (produto: any) => {
    if (produto.tamanho) return produto.tamanho;
    if (produto.largura && produto.altura) return `${Number(produto.largura).toFixed(2)}m × ${Number(produto.altura).toFixed(2)}m`;
    return null;
  };

  // Filtrar apenas portas de enrolar
  const portasEnrolar = ordem.venda?.produtos?.filter(
    p => p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'porta'
  ) || [];

  const statusConfig = getStatusConfig(ordem.status);
  const tipoConfig = getTipoEntregaConfig(ordem.venda?.tipo_entrega);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] max-w-[700px] mx-auto rounded-t-2xl overflow-hidden flex flex-col p-0 bg-zinc-900 border-t border-white/10"
      >
        <SheetDescription className="sr-only">
          Detalhes da ordem de carregamento para {ordem.nome_cliente}
        </SheetDescription>
        
        {/* Header com gradiente */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={`text-[10px] h-5 border ${tipoConfig.className}`}>
              {tipoConfig.label}
            </Badge>
            <Badge className={`text-[10px] h-5 border ${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>
            {(ordem.venda as any)?.metodo_pagamento && (
              <Badge className="text-[10px] h-5 border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                <CreditCard className="h-3 w-3 mr-1" />
                {getFormaPagamentoLabel((ordem.venda as any).metodo_pagamento)}
              </Badge>
            )}
          </div>
          <SheetTitle className="text-white text-lg font-semibold">
            {ordem.nome_cliente}
          </SheetTitle>
          {ordem.venda?.cliente_telefone && (
            <div className="flex items-center gap-1.5 mt-1 text-white/60 text-sm">
              <Phone className="h-3 w-3" />
              {ordem.venda.cliente_telefone}
            </div>
          )}
        </div>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          
          {/* Card: Endereço Completo */}
          {ordem.venda && (ordem.venda.cidade || ordem.venda.bairro || ordem.venda.cep || ordem.venda.cliente?.endereco) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                Endereço de Entrega
              </h3>
              <div className="space-y-2 pl-5">
                {ordem.venda.cliente?.endereco && (
                  <p className="text-white font-medium">{ordem.venda.cliente.endereco}</p>
                )}
                {ordem.venda.bairro && (
                  <p className="text-sm text-white/70">{ordem.venda.bairro}</p>
                )}
                {ordem.venda.cidade && ordem.venda.estado && (
                  <p className="text-sm text-white/70">
                    {ordem.venda.cidade} - {ordem.venda.estado}
                  </p>
                )}
                {ordem.venda.cep && (
                  <p className="text-sm text-white/50">CEP: {ordem.venda.cep}</p>
                )}
              </div>
            </div>
          )}

          {/* Card: Portas de Enrolar */}
          {portasEnrolar.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <DoorOpen className="h-3.5 w-3.5 text-purple-400" />
                Portas de Enrolar ({portasEnrolar.length})
              </h3>
              <div className="space-y-2">
                {portasEnrolar.map((produto, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    {/* Swatch de cor */}
                    {produto.cor ? (
                      <div 
                        className="h-10 w-10 rounded-lg border-2 border-white/20 shrink-0 shadow-lg"
                        style={{ backgroundColor: produto.cor.codigo_hex }}
                        title={produto.cor.nome}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg border-2 border-dashed border-white/20 shrink-0 flex items-center justify-center">
                        <span className="text-[8px] text-white/30">S/COR</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {formatTamanho(produto) && (
                          <Badge 
                            variant="outline" 
                            className="text-white border-white/20 bg-white/5 font-mono text-xs"
                          >
                            {formatTamanho(produto)}
                          </Badge>
                        )}
                        {produto.quantidade && produto.quantidade > 1 && (
                          <span className="text-xs text-white/50 font-medium">
                            ×{produto.quantidade}
                          </span>
                        )}
                      </div>
                      {produto.cor && (
                        <p className="text-xs text-white/60 mt-1 truncate">{produto.cor.nome}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card: Carregamento */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-orange-400" />
              Carregamento
            </h3>
            <div className="space-y-3 pl-5">
              {ordem.data_carregamento ? (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/40" />
                  <span className="text-white">
                    {format(new Date(ordem.data_carregamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>
              ) : (
                <p className="text-white/50 text-sm">Data não agendada</p>
              )}
              
              {ordem.hora && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/40" />
                  <span className="text-white">{ordem.hora}</span>
                </div>
              )}
              
              {ordem.responsavel_carregamento_nome && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-white/40" />
                  <span className="text-white">{ordem.responsavel_carregamento_nome}</span>
                </div>
              )}
              
              {ordem.carregamento_concluido && ordem.carregamento_concluido_em && (
                <div className="pt-2 border-t border-white/10">
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
                    Concluído em {format(new Date(ordem.carregamento_concluido_em), 'dd/MM/yy HH:mm')}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Card: Pedido */}
          {ordem.pedido && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-cyan-400" />
                Pedido
              </h3>
              <div className="space-y-3 pl-5">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Número:</span>
                  <span className="text-white font-mono font-semibold">
                    #{ordem.pedido.numero_pedido}
                  </span>
                </div>
                
                {ordem.pedido.etapa_atual && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Etapa:</span>
                    <Badge 
                      variant="outline" 
                      className="text-white/80 border-white/20 bg-white/5 text-[10px]"
                    >
                      {ordem.pedido.etapa_atual.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                )}
                
                {ordem.pedido.data_producao && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Produção:</span>
                    <span className="text-white/80 text-sm">
                      {format(new Date(ordem.pedido.data_producao), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card: Observações do Pedido */}
          {ordem.pedido?.observacoes && (
            <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Observações do Pedido
                </h3>
                {ordem.pedido?.updated_at && (
                  <span className="text-[10px] text-amber-400/70">
                    {format(new Date(ordem.pedido.updated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                {ordem.pedido.observacoes}
              </p>
            </div>
          )}

          {/* Card: Data Prevista Entrega */}
          {ordem.venda?.data_prevista_entrega && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span className="text-white/70 text-sm">Entrega prevista:</span>
                </div>
                <span className="text-amber-300 font-semibold">
                  {format(new Date(ordem.venda.data_prevista_entrega), 'dd/MM/yyyy')}
                </span>
              </div>
            </div>
          )}

          {/* Card: Observações */}
          {ordem.observacoes && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2">
                Observações
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">{ordem.observacoes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
