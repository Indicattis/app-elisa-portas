import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Calendar, Package, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrdemCarregamento } from "@/types/ordemCarregamento";
import { toast } from "sonner";
import { AdicionarOrdemCalendarioModal } from "./AdicionarOrdemCalendarioModal";
import { cn } from "@/lib/utils";
interface OrdensCarregamentoDisponiveisProps {
  onRefresh?: () => void;
}

// Parse de strings como "5.19x4.93" ou "5,19x4,93"
const parseTamanhoString = (tamanhoStr: string | null) => {
  if (!tamanhoStr) return {
    largura: 0,
    altura: 0
  };
  const normalizado = tamanhoStr.replace(/,/g, '.');
  const partes = normalizado.toLowerCase().split('x');
  if (partes.length === 2) {
    return {
      largura: parseFloat(partes[0]) || 0,
      altura: parseFloat(partes[1]) || 0
    };
  }
  return {
    largura: 0,
    altura: 0
  };
};

// Calcular lista de portas P/G
const getPortasInfo = (ordem: OrdemCarregamento) => {
  const produtos = ordem.venda?.produtos || [];
  const portasEnrolar = produtos.filter(p => p.tipo_produto === 'porta_enrolar');
  const lista: {
    tamanho: 'P' | 'G';
    largura: number;
    altura: number;
    area: number;
    peso: number | null;
  }[] = [];
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
    const peso = largura > 0 && altura > 0 ? largura * altura * 12 * 2 * 0.3 : null;
    for (let i = 0; i < quantidade; i++) {
      lista.push({
        tamanho: tamanhoCategoria,
        largura,
        altura,
        area,
        peso
      });
    }
  });
  return lista;
};
export const OrdensCarregamentoDisponiveis = ({
  onRefresh
}: OrdensCarregamentoDisponiveisProps) => {
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
      const {
        data,
        error
      } = await supabase.from("ordens_carregamento").select(`
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
        `).is("data_carregamento", null).order("created_at", {
        ascending: false
      });
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
    const {
      error
    } = await supabase.from("ordens_carregamento").update({
      data_carregamento: params.data_carregamento,
      hora: params.hora,
      tipo_carregamento: params.tipo_carregamento,
      responsavel_carregamento_id: params.responsavel_carregamento_id,
      responsavel_carregamento_nome: params.responsavel_carregamento_nome,
      status: 'agendada',
      updated_at: new Date().toISOString()
    }).eq("id", params.ordemId);
    if (error) throw error;
    toast.success("Carregamento agendado com sucesso!");
    fetchOrdensDisponiveis();
    onRefresh?.();
    setModalOpen(false);
    setOrdemSelecionada(null);
  };

  // Filtrar ordens por termo de busca
  const ordensFiltradas = ordens.filter(ordem => {
    const termo = searchTerm.toLowerCase();
    return ordem.nome_cliente.toLowerCase().includes(termo) || ordem.pedido?.numero_pedido.toLowerCase().includes(termo) || ordem.venda?.cidade?.toLowerCase().includes(termo) || ordem.venda?.estado?.toLowerCase().includes(termo);
  });

  // Extrair cores únicas de uma ordem
  const getCoresUnicas = (ordem: OrdemCarregamento) => {
    if (!ordem.venda?.produtos) return [];
    const coresMap = new Map<string, {
      nome: string;
      codigo_hex: string;
    }>();
    ordem.venda.produtos.forEach(produto => {
      if (produto.cor) {
        coresMap.set(produto.cor.codigo_hex, produto.cor);
      }
    });
    return Array.from(coresMap.values());
  };
  return <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Ordens Disponíveis para Agendamento</CardTitle>
              <Badge variant="secondary">{ordensFiltradas.length}</Badge>
            </div>
          </div>
          
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente, pedido ou localização..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9" />
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-xs">
                    <th className="text-left font-medium p-2 min-w-[150px]">Cliente</th>
                    <th className="text-left font-medium p-2 min-w-[100px]">Pedido</th>
                    <th className="text-center font-medium p-2 min-w-[80px]">Portas</th>
                    <th className="text-left font-medium p-2 min-w-[120px]">Localização</th>
                    <th className="text-left font-medium p-2 min-w-[120px]">Cores</th>
                    <th className="text-left font-medium p-2 min-w-[100px]">Serviço</th>
                    <th className="text-right font-medium p-2 min-w-[90px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Carregando ordens...
                      </td>
                    </tr> : ordensFiltradas.length === 0 ? <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Nenhuma ordem disponível
                      </td>
                    </tr> : ordensFiltradas.map(ordem => {
                  const cores = getCoresUnicas(ordem);
                  const maxCoresVisiveis = 5;
                  const coresVisiveis = cores.slice(0, maxCoresVisiveis);
                  const coresRestantes = cores.length - maxCoresVisiveis;
                  const portasInfo = getPortasInfo(ordem);
                  return <tr key={ordem.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-2 h-[35px]">
                            <div className="font-medium truncate">{ordem.nome_cliente}</div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Package className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{ordem.pedido?.numero_pedido || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <TooltipProvider>
                              <div className="flex items-center justify-center gap-0.5 flex-wrap">
                                {portasInfo.slice(0, 6).map((porta, idx) => <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4 text-white cursor-default", porta.tamanho === 'P' ? "bg-blue-500 border-blue-500" : "bg-orange-500 border-orange-500")}>
                                        {porta.tamanho}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{porta.largura.toFixed(2)}m × {porta.altura.toFixed(2)}m</p>
                                      <p className="text-xs text-muted-foreground">{porta.area.toFixed(2)} m²</p>
                                      {porta.peso && <p className="text-xs">Peso: {porta.peso.toFixed(1)} kg</p>}
                                    </TooltipContent>
                                  </Tooltip>)}
                                {portasInfo.length > 6 && <Tooltip>
                                    <TooltipTrigger>
                                      <span className="text-[9px] text-muted-foreground">+{portasInfo.length - 6}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{portasInfo.filter(p => p.tamanho === 'P').length} pequena(s) (≤25m²)</p>
                                      <p>{portasInfo.filter(p => p.tamanho === 'G').length} grande(s) ({'>'}25m²)</p>
                                    </TooltipContent>
                                  </Tooltip>}
                                {portasInfo.length === 0 && <span className="text-muted-foreground text-[10px]">—</span>}
                              </div>
                            </TooltipProvider>
                          </td>
                          <td className="p-2">
                            {ordem.venda && <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {ordem.venda.cidade}/{ordem.venda.estado}
                                </span>
                              </div>}
                          </td>
                          <td className="p-2">
                            <TooltipProvider>
                              <div className="flex flex-col gap-1">
                                {coresVisiveis.map((cor, idx) => <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <div className="border border-border cursor-help flex-shrink-0" style={{
                                backgroundColor: cor.codigo_hex,
                                height: '15px',
                                width: '80px',
                                borderRadius: '20px'
                              }} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{cor.nome}</p>
                                      <p className="text-xs text-muted-foreground">{cor.codigo_hex}</p>
                                    </TooltipContent>
                                  </Tooltip>)}
                                {coresRestantes > 0 && <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="bg-muted border border-border flex items-center justify-center text-[10px] font-medium cursor-help flex-shrink-0" style={{
                                height: '15px',
                                width: '80px',
                                borderRadius: '20px'
                              }}>
                                        +{coresRestantes} cores
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {cores.slice(maxCoresVisiveis).map((cor, idx) => <div key={idx} className="flex items-center gap-2">
                                            <div className="border" style={{
                                    backgroundColor: cor.codigo_hex,
                                    height: '10px',
                                    width: '40px',
                                    borderRadius: '10px'
                                  }} />
                                            <span className="text-xs">{cor.nome}</span>
                                          </div>)}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>}
                              </div>
                            </TooltipProvider>
                          </td>
                          <td className="p-2">
                            <Badge variant={ordem.venda?.tipo_entrega === 'entrega' ? 'default' : 'secondary'} className="text-xs">
                              {ordem.venda?.tipo_entrega === 'entrega' ? 'Entrega' : 'Instalação'}
                            </Badge>
                          </td>
                          <td className="p-2 text-right">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleAgendar(ordem)}>
                              <Calendar className="h-3 w-3 mr-1.5" />
                              Agendar
                            </Button>
                          </td>
                        </tr>;
                })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <AdicionarOrdemCalendarioModal open={modalOpen} onOpenChange={setModalOpen} dataSelecionada={new Date()} onConfirm={handleConfirmAgendar} ordemPreSelecionada={ordemSelecionada} />
    </>;
};