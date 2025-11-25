import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Calendar, Package, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OrdemCarregamento, AgendarCarregamentoData } from "@/types/ordemCarregamento";
import { toast } from "sonner";
import { AgendarCarregamentoModal } from "./AgendarCarregamentoModal";
import { useOrdensCarregamento } from "@/hooks/useOrdensCarregamento";

interface OrdensCarregamentoDisponiveisProps {
  onRefresh?: () => void;
}

export const OrdensCarregamentoDisponiveis = ({ onRefresh }: OrdensCarregamentoDisponiveisProps) => {
  const [ordens, setOrdens] = useState<OrdemCarregamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordemSelecionada, setOrdemSelecionada] = useState<OrdemCarregamento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { agendarCarregamento } = useOrdensCarregamento();

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
            produtos:produtos_vendas(
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

  const handleConfirmAgendar = async (data: AgendarCarregamentoData) => {
    if (!ordemSelecionada) return;

    try {
      await agendarCarregamento({ id: ordemSelecionada.id, data });
      toast.success("Carregamento agendado com sucesso!");
      fetchOrdensDisponiveis();
      onRefresh?.();
      setModalOpen(false);
      setOrdemSelecionada(null);
    } catch (error) {
      console.error("Erro ao agendar:", error);
      toast.error("Erro ao agendar carregamento");
    }
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
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Ordens Disponíveis para Agendamento</CardTitle>
              <Badge variant="secondary">{ordensFiltradas.length}</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Arraste as ordens para o calendário ou clique em "Agendar"
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, pedido ou localização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-xs">
                    <th className="text-left font-medium p-2 min-w-[150px]">Cliente</th>
                    <th className="text-left font-medium p-2 min-w-[100px]">Pedido</th>
                    <th className="text-left font-medium p-2 min-w-[120px]">Localização</th>
                    <th className="text-left font-medium p-2 min-w-[120px]">Cores</th>
                    <th className="text-left font-medium p-2 min-w-[100px]">Tipo</th>
                    <th className="text-right font-medium p-2 min-w-[90px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Carregando ordens...
                      </td>
                    </tr>
                  ) : ordensFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhuma ordem disponível
                      </td>
                    </tr>
                  ) : (
                    ordensFiltradas.map((ordem) => {
                      const cores = getCoresUnicas(ordem);
                      const maxCoresVisiveis = 5;
                      const coresVisiveis = cores.slice(0, maxCoresVisiveis);
                      const coresRestantes = cores.length - maxCoresVisiveis;

                      return (
                        <tr key={ordem.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
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
                            {ordem.venda && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {ordem.venda.cidade}/{ordem.venda.estado}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-2">
                            <TooltipProvider>
                              <div className="flex items-center gap-1">
                                {coresVisiveis.map((cor, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="h-5 w-5 rounded-full border border-border cursor-help flex-shrink-0"
                                        style={{ backgroundColor: cor.codigo_hex }}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">{cor.nome}</p>
                                      <p className="text-xs text-muted-foreground">{cor.codigo_hex}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {coresRestantes > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-medium cursor-help flex-shrink-0">
                                        +{coresRestantes}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        {cores.slice(maxCoresVisiveis).map((cor, idx) => (
                                          <div key={idx} className="flex items-center gap-2">
                                            <div
                                              className="h-3 w-3 rounded-full border"
                                              style={{ backgroundColor: cor.codigo_hex }}
                                            />
                                            <span className="text-xs">{cor.nome}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TooltipProvider>
                          </td>
                          <td className="p-2">
                            <Badge
                              variant={ordem.tipo_carregamento === 'elisa' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {ordem.tipo_carregamento === 'elisa' ? 'Instalação' : 'Autorizado'}
                            </Badge>
                          </td>
                          <td className="p-2 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleAgendar(ordem)}
                            >
                              <Calendar className="h-3 w-3 mr-1.5" />
                              Agendar
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <AgendarCarregamentoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        ordem={ordemSelecionada}
        onConfirm={handleConfirmAgendar}
      />
    </>
  );
};
