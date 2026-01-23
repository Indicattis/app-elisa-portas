import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { toast } from "sonner";
import { AdicionarOrdemCalendarioModal } from "./AdicionarOrdemCalendarioModal";
import { cn } from "@/lib/utils";

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
const getPortasInfo = (ordem: OrdemCarregamento) => {
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

export const OrdensCarregamentoDisponiveisMobile = ({ onRefresh }: OrdensCarregamentoDisponiveisMobileProps) => {
  const [ordens, setOrdens] = useState<OrdemCarregamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemCarregamento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchOrdensDisponiveis();
  }, []);

  const fetchOrdensDisponiveis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ordens_carregamento")
        .select(`
          *,
          venda:vendas(
            id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            estado,
            cidade,
            cep,
            bairro,
            data_prevista_entrega,
            tipo_entrega,
            produtos:produtos_vendas(
              tipo_produto,
              tamanho,
              largura,
              altura,
              quantidade,
              cor:catalogo_cores(
                nome,
                codigo_hex
              )
            )
          ),
          pedido:pedidos_producao!ordens_carregamento_pedido_id_fkey(
            id,
            numero_pedido,
            etapa_atual
          )
        `)
        .is("data_carregamento", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrdens((data || []) as OrdemCarregamento[]);
    } catch (error) {
      console.error("Erro ao buscar ordens:", error);
      toast.error("Erro ao carregar ordens disponíveis");
    } finally {
      setLoading(false);
    }
  };

  const handleAgendar = (ordem: OrdemCarregamento) => {
    setOrdemSelecionada(ordem);
    setModalOpen(true);
  };

  const handleConfirmAgendar = async (params: {
    ordemId: string;
    data_carregamento: string;
    hora: string;
    tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro';
    responsavel_carregamento_id: string | null;
    responsavel_carregamento_nome: string;
  }) => {
    const { error } = await supabase
      .from("ordens_carregamento")
      .update({
        data_carregamento: params.data_carregamento,
        hora: params.hora,
        tipo_carregamento: params.tipo_carregamento,
        responsavel_carregamento_id: params.responsavel_carregamento_id,
        responsavel_carregamento_nome: params.responsavel_carregamento_nome,
        status: 'agendada',
        updated_at: new Date().toISOString()
      })
      .eq("id", params.ordemId);

    if (error) throw error;

    toast.success("Carregamento agendado com sucesso!");
    fetchOrdensDisponiveis();
    onRefresh?.();
    setModalOpen(false);
    setOrdemSelecionada(null);
  };

  // Filtrar ordens por termo de busca
  const ordensFiltradas = ordens.filter((ordem) => {
    const termo = searchTerm.toLowerCase();
    return (
      ordem.nome_cliente.toLowerCase().includes(termo) ||
      ordem.pedido?.numero_pedido.toLowerCase().includes(termo) ||
      ordem.venda?.cidade?.toLowerCase().includes(termo) ||
      ordem.venda?.estado?.toLowerCase().includes(termo)
    );
  });

  // Extrair cores únicas de uma ordem
  const getCoresUnicas = (ordem: OrdemCarregamento) => {
    if (!ordem.venda?.produtos) return [];
    
    const coresMap = new Map<string, { nome: string; codigo_hex: string }>();
    
    ordem.venda.produtos.forEach((produto) => {
      if (produto.cor) {
        coresMap.set(produto.cor.codigo_hex, produto.cor);
      }
    });
    
    return Array.from(coresMap.values());
  };

  return (
    <>
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader className="pb-2 px-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">Ordens Disponíveis</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toque para agendar
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
                    onClick={() => handleAgendar(ordem)}
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
                        <Badge 
                          variant={ordem.venda?.tipo_entrega === 'entrega' ? 'default' : 'secondary'}
                          className="text-[10px] h-5"
                        >
                          {ordem.venda?.tipo_entrega === 'entrega' ? 'Entrega' : 'Instalação'}
                        </Badge>
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

                    {/* Indicador de ação */}
                    <div className="flex items-center justify-end mt-2 text-primary">
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
        ordemPreSelecionada={ordemSelecionada}
      />
    </>
  );
};
