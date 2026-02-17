import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Package, MapPin, Calendar, Truck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { AdicionarOrdemCalendarioModal } from "./AdicionarOrdemCalendarioModal";
import { OrdemCarregamentoDetails } from "./OrdemCarregamentoDetails";
import { cn } from "@/lib/utils";
import { useOrdensCarregamentoUnificadas, OrdemCarregamentoUnificada } from "@/hooks/useOrdensCarregamentoUnificadas";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface OrdensCarregamentoDisponiveisMobileProps {
  onRefresh?: () => void;
}

// Parse de strings como "5.19x4.93" ou "5,19x4,93"
const parseTamanhoString = (tamanhoStr: string | null) => {
  if (!tamanhoStr) return { largura: 0, altura: 0 };
  const normalizado = tamanhoStr.replace(/,/g, '.');
  const partes = normalizado.toLowerCase().split('x');
  if (partes.length === 2) {
    return { 
      largura: parseFloat(partes[0]) || 0, 
      altura: parseFloat(partes[1]) || 0 
    };
  }
  return { largura: 0, altura: 0 };
};

// Calcular lista de portas P/G
const getPortasInfo = (ordem: OrdemCarregamentoUnificada) => {
  const produtos = ordem.venda?.produtos || [];
  const portasEnrolar = produtos.filter(p => p.tipo_produto === 'porta_enrolar');
  const lista: { tamanho: 'P' | 'G'; largura: number; altura: number; area: number }[] = [];
  
  portasEnrolar.forEach(p => {
    let largura = p.largura || 0;
    let altura = p.altura || 0;
    
    if (largura === 0 && altura === 0 && p.tamanho) {
      const parsed = parseTamanhoString(p.tamanho);
      largura = parsed.largura;
      altura = parsed.altura;
    }
    
    const area = largura * altura;
    const quantidade = p.quantidade || 1;
    const tamanhoCategoria = area > 25 ? 'G' : 'P';
    
    for (let i = 0; i < quantidade; i++) {
      lista.push({ tamanho: tamanhoCategoria, largura, altura, area });
    }
  });
  
  return lista;
};

// Converter OrdemCarregamentoUnificada para OrdemCarregamento (para o details)
const toOrdemCarregamento = (ordem: OrdemCarregamentoUnificada): OrdemCarregamento => ({
  id: ordem.id,
  pedido_id: ordem.pedido_id,
  venda_id: ordem.venda_id,
  nome_cliente: ordem.nome_cliente,
  tipo_carregamento: ordem.tipo_carregamento,
  data_carregamento: ordem.data_carregamento,
  hora: ordem.hora || null,
  hora_carregamento: ordem.hora_carregamento,
  responsavel_carregamento_id: ordem.responsavel_carregamento_id,
  responsavel_carregamento_nome: ordem.responsavel_carregamento_nome,
  status: ordem.status,
  carregamento_concluido: ordem.carregamento_concluido,
  carregamento_concluido_em: null,
  carregamento_concluido_por: null,
  latitude: null,
  longitude: null,
  geocode_precision: null,
  last_geocoded_at: null,
  observacoes: ordem.observacoes || null,
  created_at: ordem.created_at || null,
  updated_at: null,
  created_by: null,
  fonte: ordem.fonte,
  pedido: ordem.pedido,
  venda: ordem.venda ? {
    id: ordem.venda.id,
    cliente_nome: ordem.venda.cliente_nome,
    cliente_telefone: ordem.venda.cliente_telefone,
    cliente_email: ordem.venda.cliente_email,
    cidade: ordem.venda.cidade,
    estado: ordem.venda.estado,
    cep: ordem.venda.cep,
    bairro: ordem.venda.bairro,
    tipo_entrega: ordem.venda.tipo_entrega === 'manutencao' ? 'instalacao' : ordem.venda.tipo_entrega,
    produtos: ordem.venda.produtos,
  } : null,
});

// Obter iniciais do nome
const getInitials = (nome: string) => {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};

export const OrdensCarregamentoDisponiveisMobile = ({ onRefresh }: OrdensCarregamentoDisponiveisMobileProps) => {
  const queryClient = useQueryClient();
  const { ordens, isLoading: loading } = useOrdensCarregamentoUnificadas();
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemCarregamentoUnificada | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // States para downbar de detalhes
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrdem, setSelectedOrdem] = useState<OrdemCarregamento | null>(null);

  // Filtrar apenas ordens SEM data de carregamento (disponíveis para agendamento)
  const ordensDisponiveis = ordens.filter(o => !o.data_carregamento);

  const handleAgendar = (e: React.MouseEvent, ordem: OrdemCarregamentoUnificada) => {
    e.stopPropagation();
    setOrdemSelecionada(ordem);
    setModalOpen(true);
  };

  const handleCardClick = (ordem: OrdemCarregamentoUnificada) => {
    setSelectedOrdem(toOrdemCarregamento(ordem));
    setDetailsOpen(true);
  };

  const handleConfirmAgendar = async (params: {
    ordemId: string;
    data_carregamento: string;
    hora: string;
    tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro';
    responsavel_carregamento_id: string | null;
    responsavel_carregamento_nome: string;
  }) => {
    if (!ordemSelecionada) return;

    // Determinar a tabela correta com base na fonte
    const tabela = ordemSelecionada.fonte === 'instalacoes' ? 'instalacoes' : 'ordens_carregamento';
    
    // Para instalações, usar valor padrão "08:00" se hora for null (constraint NOT NULL)
    const horaValue = ordemSelecionada.fonte === 'instalacoes' ? (params.hora || "08:00") : params.hora;

    // Status para instalações: 'pronta_fabrica' (check constraint não aceita 'agendada')
    // Status para ordens_carregamento: 'agendada'
    const statusValue = ordemSelecionada.fonte === 'instalacoes' ? 'pronta_fabrica' : 'agendada';

    if (ordemSelecionada.fonte === 'instalacoes') {
      // Verificar se o registro existe na tabela instalacoes
      const { data: existing } = await supabase
        .from("instalacoes").select("id").eq("id", params.ordemId).maybeSingle();

      if (!existing) {
        // Pedido órfão: buscar dados e criar registro
        const { data: pedido } = await supabase
          .from("pedidos_producao")
          .select("id, venda_id, vendas(cliente_nome)")
          .eq("id", params.ordemId).maybeSingle();

        const nomeCliente = (pedido as any)?.vendas?.cliente_nome || 'Cliente';

        const { error } = await supabase.from("instalacoes").insert({
          pedido_id: params.ordemId,
          venda_id: pedido?.venda_id || null,
          nome_cliente: nomeCliente,
          hora: horaValue,
          status: statusValue,
          instalacao_concluida: false,
          carregamento_concluido: false,
          data_carregamento: params.data_carregamento,
          hora_carregamento: params.hora,
          tipo_carregamento: params.tipo_carregamento,
          responsavel_carregamento_id: params.responsavel_carregamento_id,
          responsavel_carregamento_nome: params.responsavel_carregamento_nome,
        } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("instalacoes")
          .update({
            data_carregamento: params.data_carregamento,
            hora_carregamento: params.hora,
            hora: horaValue,
            tipo_carregamento: params.tipo_carregamento,
            responsavel_carregamento_id: params.responsavel_carregamento_id,
            responsavel_carregamento_nome: params.responsavel_carregamento_nome,
            status: statusValue,
            updated_at: new Date().toISOString()
          })
          .eq("id", params.ordemId);
        if (error) throw error;
      }
    } else {
      const { error } = await supabase
        .from("ordens_carregamento")
        .update({
          data_carregamento: params.data_carregamento,
          hora_carregamento: params.hora,
          hora: params.hora,
          tipo_carregamento: params.tipo_carregamento,
          responsavel_carregamento_id: params.responsavel_carregamento_id,
          responsavel_carregamento_nome: params.responsavel_carregamento_nome,
          status: 'agendada',
          updated_at: new Date().toISOString()
        })
        .eq("id", params.ordemId);
      if (error) throw error;
    }

    toast.success("Carregamento agendado com sucesso!");
    
    // Invalidar queries para atualizar dados
    queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_unificadas"] });
    queryClient.invalidateQueries({ queryKey: ["ordens_carregamento_calendario"] });
    
    onRefresh?.();
    setModalOpen(false);
    setOrdemSelecionada(null);
  };

  // Filtrar ordens por termo de busca
  const ordensFiltradas = ordensDisponiveis.filter((ordem) => {
    const termo = searchTerm.toLowerCase();
    return (
      ordem.nome_cliente.toLowerCase().includes(termo) ||
      ordem.pedido?.numero_pedido?.toLowerCase().includes(termo) ||
      ordem.venda?.cidade?.toLowerCase().includes(termo) ||
      ordem.venda?.estado?.toLowerCase().includes(termo) ||
      ordem.vendedor?.nome?.toLowerCase().includes(termo)
    );
  });

  // Extrair cores únicas de uma ordem
  const getCoresUnicas = (ordem: OrdemCarregamentoUnificada) => {
    if (!ordem.venda?.produtos) return [];
    
    const coresMap = new Map<string, { nome: string; codigo_hex: string }>();
    
    ordem.venda.produtos.forEach((produto) => {
      if (produto.cor) {
        coresMap.set(produto.cor.codigo_hex, produto.cor);
      }
    });
    
    return Array.from(coresMap.values());
  };

  // Obter badge de tipo de serviço
  const getTipoServicoBadge = (ordem: OrdemCarregamentoUnificada) => {
    const tipo = ordem.tipo_entrega;
    
    if (tipo === 'entrega') {
      return (
        <Badge variant="default" className="text-[10px] h-5">
          <Truck className="h-3 w-3 mr-1" />
          Entrega
        </Badge>
      );
    }
    
    if (tipo === 'manutencao') {
      return (
        <Badge 
          variant="secondary" 
          className="text-[10px] h-5 bg-purple-500/20 text-purple-600 border-purple-500/30"
        >
          <Wrench className="h-3 w-3 mr-1" />
          Manutenção
        </Badge>
      );
    }
    
    // instalacao
    return (
      <Badge 
        variant="secondary" 
        className="text-[10px] h-5 bg-orange-500/20 text-orange-600 border-orange-500/30"
      >
        <Wrench className="h-3 w-3 mr-1" />
        Instalação
      </Badge>
    );
  };

  return (
    <>
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader className="pb-2 px-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Ordens Disponíveis</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toque para detalhes, agende pelo botão
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {ordensFiltradas.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-0">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente, pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Lista de Cards */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Carregando ordens...
              </div>
            ) : ordensFiltradas.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhuma ordem disponível
              </div>
            ) : (
              ordensFiltradas.map((ordem) => {
                const cores = getCoresUnicas(ordem);
                const portasInfo = getPortasInfo(ordem);
                
                return (
                  <Card 
                    key={ordem.id} 
                    className="p-3 cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors border-border/50"
                    onClick={() => handleCardClick(ordem)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {/* Info Principal */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {ordem.nome_cliente}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            {ordem.pedido?.numero_pedido || 'N/A'}
                          </span>
                        </div>
                        {ordem.venda && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground truncate">
                              {ordem.venda.cidade}/{ordem.venda.estado}
                            </span>
                          </div>
                        )}
                        {/* Vendedor */}
                        {ordem.vendedor && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={ordem.vendedor.foto_perfil_url || undefined} />
                              <AvatarFallback className="text-[6px]">
                                {getInitials(ordem.vendedor.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {ordem.vendedor.nome.split(' ')[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lado Direito */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {/* Badges de Portas */}
                        {portasInfo.length > 0 && (
                          <div className="flex gap-0.5 flex-wrap justify-end">
                            {portasInfo.slice(0, 4).map((porta, idx) => (
                              <Badge 
                                key={idx}
                                variant="outline"
                                className={cn(
                                  "text-[9px] px-1 py-0 h-4 text-white",
                                  porta.tamanho === 'P' 
                                    ? "bg-blue-500 border-blue-500"
                                    : "bg-orange-500 border-orange-500"
                                )}
                              >
                                {porta.tamanho}
                              </Badge>
                            ))}
                            {portasInfo.length > 4 && (
                              <span className="text-[9px] text-muted-foreground">
                                +{portasInfo.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Tipo de Serviço */}
                        {getTipoServicoBadge(ordem)}
                      </div>
                    </div>

                    {/* Cores */}
                    {cores.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {cores.slice(0, 4).map((cor, idx) => (
                          <div
                            key={idx}
                            className="h-2.5 flex-1 max-w-[50px] rounded-full border border-border/50"
                            style={{ backgroundColor: cor.codigo_hex }}
                          />
                        ))}
                        {cores.length > 4 && (
                          <span className="text-[9px] text-muted-foreground self-center">
                            +{cores.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Botão de Agendar */}
                    <div 
                      className="flex items-center justify-end mt-2 text-primary"
                      onClick={(e) => handleAgendar(e, ordem)}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className="text-[10px] font-medium">Agendar</span>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <AdicionarOrdemCalendarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dataSelecionada={new Date()}
        onConfirm={handleConfirmAgendar}
        ordemPreSelecionada={ordemSelecionada as any}
      />

      <OrdemCarregamentoDetails
        ordem={selectedOrdem}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
};
