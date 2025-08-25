import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Edit, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePedidos } from "@/hooks/usePedidos";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { generatePedidoPDF } from "@/utils/pedidoPDFGenerator";

interface Produto {
  id?: string;
  tipo_produto?: string;
  descricao?: string;
  cor?: string;
  medidas?: string;
  quantidade?: number;
  valor?: number;
  [key: string]: any;
}

interface Pedido {
  id: string;
  numero_pedido: string;
  orcamento_id?: string;
  cliente_nome: string;
  cliente_telefone?: string;
  cliente_email?: string;
  cliente_cpf?: string;
  cliente_bairro?: string;
  status: string;
  created_at: string;
  data_entrega?: string;
  observacoes?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
  venda_id?: string;
  forma_pagamento?: string;
  valor_venda?: number;
  valor_entrada?: number;
  numero_parcelas?: number;
  observacoes_venda?: string;
  produtos: Produto[];
  valor_frete?: number;
  valor_instalacao?: number;
  modalidade_instalacao?: string;
}

const statusColors = {
  'em_lancamento': 'bg-yellow-100 text-yellow-800',
  'pendente': 'bg-gray-100 text-gray-800',
  'em_andamento': 'bg-blue-100 text-blue-800',
  'para_instalacao': 'bg-purple-100 text-purple-800',
  'concluido': 'bg-green-100 text-green-800',
};

const statusLabels = {
  'em_lancamento': 'Em Lançamento',
  'pendente': 'Pendente',
  'em_andamento': 'Em Andamento',
  'para_instalacao': 'Para Instalação',
  'concluido': 'Concluído',
};

const tiposOrdem = [
  { key: 'soldagem', label: 'Soldagem' },
  { key: 'pintura', label: 'Pintura' },
  { key: 'separacao', label: 'Separação' },
  { key: 'perfiladeira', label: 'Perfiladeira' },
  { key: 'instalacao', label: 'Instalação' },
];

export default function Pedidos() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { pedidos, loading, criarOrdemProducao, calcularOrdensNecessarias } = usePedidos();
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set());
  const [ordensProducao, setOrdensProducao] = useState<Record<string, {
    soldagem: any[];
    pintura: any[];
    separacao: any[];
    perfiladeira: any[];
    instalacao: any[];
  }>>({});

  const handleDownloadPDF = async (pedido: Pedido) => {
    try {
      generatePedidoPDF({
        pedido,
        vendaData: {
          forma_pagamento: pedido.forma_pagamento,
          valor_venda: pedido.valor_venda,
          valor_entrada: pedido.valor_entrada,
          numero_parcelas: pedido.numero_parcelas,
          observacoes_venda: pedido.observacoes_venda,
        }
      });

      toast({
        title: "Sucesso",
        description: "PDF do pedido gerado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar PDF do pedido",
      });
    }
  };

  const handleEditPedido = (pedido: Pedido) => {
    navigate(`/dashboard/pedidos/edit/${pedido.id}`);
  };

  const togglePedidoExpansion = async (pedidoId: string) => {
    const newExpanded = new Set(expandedPedidos);
    
    if (expandedPedidos.has(pedidoId)) {
      newExpanded.delete(pedidoId);
    } else {
      newExpanded.add(pedidoId);
      // Buscar ordens de produção se ainda não foram carregadas
      if (!ordensProducao[pedidoId]) {
        await fetchOrdensProducao(pedidoId);
      }
    }
    
    setExpandedPedidos(newExpanded);
  };

  const fetchOrdensProducao = async (pedidoId: string) => {
    try {
      const ordensData = {
        soldagem: [],
        pintura: [],
        separacao: [],
        perfiladeira: [],
        instalacao: [],
      };

      // Buscar ordens de soldagem
      const { data: soldagem, error: errorSoldagem } = await supabase
        .from("ordens_soldagem")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (errorSoldagem) throw errorSoldagem;
      ordensData.soldagem = soldagem || [];

      // Buscar ordens de pintura
      const { data: pintura, error: errorPintura } = await supabase
        .from("ordens_pintura")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (errorPintura) throw errorPintura;
      ordensData.pintura = pintura || [];

      // Buscar ordens de separação
      const { data: separacao, error: errorSeparacao } = await supabase
        .from("ordens_separacao")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (errorSeparacao) throw errorSeparacao;
      ordensData.separacao = separacao || [];

      // Buscar ordens de perfiladeira
      const { data: perfiladeira, error: errorPerfiladeira } = await supabase
        .from("ordens_perfiladeira")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (errorPerfiladeira) throw errorPerfiladeira;
      ordensData.perfiladeira = perfiladeira || [];

      // Buscar ordens de instalação
      const { data: instalacao, error: errorInstalacao } = await supabase
        .from("ordens_instalacao")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (errorInstalacao) throw errorInstalacao;
      ordensData.instalacao = instalacao || [];

      setOrdensProducao(prev => ({
        ...prev,
        [pedidoId]: ordensData
      }));
    } catch (error) {
      console.error("Erro ao buscar ordens:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar ordens de produção",
      });
    }
  };

  const handleEditOrdem = (ordemId: string, tipoOrdem: string) => {
    navigate(`/dashboard/ordens/${tipoOrdem}/${ordemId}`);
  };

  const handleDownloadOrdemPDF = (ordem: any) => {
    // TODO: Implementar geração de PDF para ordem específica
    toast({
      title: "Em desenvolvimento",
      description: "PDF da ordem será implementado em breve",
    });
  };

  const handleCriarOrdens = async (pedidoId: string, tipoOrdem: string, pedidoNumero: string, produtos: Produto[]) => {
    try {
      await criarOrdemProducao(pedidoId, tipoOrdem, pedidoNumero);
      // Recarregar as ordens do pedido
      await fetchOrdensProducao(pedidoId);
    } catch (error) {
      console.error("Erro ao criar ordens:", error);
    }
  };

  const getTotalPedidos = () => pedidos.length;
  const getPedidosEmLancamento = () => pedidos.filter(p => p.status === 'em_lancamento').length;
  const getPedidosEmAndamento = () => pedidos.filter(p => p.status === 'em_andamento').length;
  const getPedidosConcluidos = () => pedidos.filter(p => p.status === 'concluido').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie pedidos de produção</p>
        </div>
      </div>

      {/* Estatísticas dos pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-foreground">{getTotalPedidos()}</div>
          <div className="text-sm text-muted-foreground">Total de Pedidos</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">{getPedidosEmLancamento()}</div>
          <div className="text-sm text-muted-foreground">Em Lançamento</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{getPedidosEmAndamento()}</div>
          <div className="text-sm text-muted-foreground">Em Andamento</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{getPedidosConcluidos()}</div>
          <div className="text-sm text-muted-foreground">Concluídos</div>
        </div>
      </div>

      {/* Tabela de pedidos */}
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <>
                  <TableRow 
                    key={pedido.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onDoubleClick={() => togglePedidoExpansion(pedido.id)}
                  >
                    <TableCell className="w-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePedidoExpansion(pedido.id)}
                        className="p-0 h-6 w-6"
                      >
                        {expandedPedidos.has(pedido.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {pedido.numero_pedido}
                    </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pedido.cliente_nome}</div>
                      <div className="text-sm text-muted-foreground">
                        {pedido.cliente_telefone || 'Não informado'}
                      </div>
                      {pedido.cliente_email && (
                          <div className="text-xs text-muted-foreground">
                            {pedido.cliente_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {pedido.produtos && pedido.produtos.length > 0 ? (
                        pedido.produtos.map((produto: any, index: number) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{produto.tipo_produto || 'Produto'}</span>
                            {produto.cor && <span className="text-muted-foreground"> - {produto.cor}</span>}
                            {produto.medidas && <span className="text-muted-foreground"> ({produto.medidas})</span>}
                            {produto.quantidade > 1 && <span className="text-muted-foreground"> x{produto.quantidade}</span>}
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Sem produtos</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      {pedido.valor_venda && (
                        <div className="font-medium">
                          R$ {pedido.valor_venda.toLocaleString('pt-BR', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      )}
                      {pedido.forma_pagamento && (
                        <div className="text-sm text-muted-foreground">
                          {pedido.forma_pagamento}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[pedido.status as keyof typeof statusColors]}>
                      {statusLabels[pedido.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {pedido.data_entrega 
                      ? new Date(pedido.data_entrega).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPedido(pedido)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(pedido)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Ordens de Produção Expandidas */}
                {expandedPedidos.has(pedido.id) && (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <div className="bg-muted/20 p-4 border-l-4 border-primary/20">
                        <h4 className="font-semibold mb-3 text-sm">Ordens de Produção</h4>
                        <div className="space-y-3">
                          {tiposOrdem.map((tipoOrdem) => {
                            const ordensDoTipo = ordensProducao[pedido.id]?.[tipoOrdem.key as keyof typeof ordensProducao[string]] || [];
                            const ordensNecessarias = calcularOrdensNecessarias(pedido.produtos, tipoOrdem.key);
                            const ordensExistentes = ordensDoTipo.length;
                            const ordensRestantes = Math.max(0, ordensNecessarias - ordensExistentes);
                            
                            return (
                              <div key={tipoOrdem.key} className="bg-background p-3 rounded border">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{tipoOrdem.label}</span>
                                    <div className="flex gap-1">
                                      {ordensExistentes > 0 && (
                                        <Badge variant="secondary">{ordensExistentes} criada(s)</Badge>
                                      )}
                                      {ordensRestantes > 0 && (
                                        <Badge variant="outline">{ordensRestantes} necessária(s)</Badge>
                                      )}
                                      {ordensNecessarias === 0 && (
                                        <Badge variant="outline">Não necessário</Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {ordensRestantes > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCriarOrdens(pedido.id, tipoOrdem.key, pedido.numero_pedido, pedido.produtos)}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Criar {ordensRestantes} Ordem(s)
                                    </Button>
                                  )}
                                </div>
                                
                                {ordensExistentes > 0 && (
                                  <div className="space-y-2">
                                    {ordensDoTipo.map((ordem: any) => (
                                      <div key={ordem.id} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-mono">{ordem.numero_ordem}</span>
                                          <Badge variant={ordem.status === 'pronto' ? 'default' : 'secondary'}>
                                            {ordem.status === 'pendente_preenchimento' ? 'Pendente' : ordem.status}
                                          </Badge>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditOrdem(ordem.id, tipoOrdem.key)}
                                          >
                                            <Edit className="w-3 h-3 mr-1" />
                                            Editar
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadOrdemPDF(ordem)}
                                          >
                                            <Download className="w-3 h-3 mr-1" />
                                            PDF
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {ordensNecessarias > 0 && (
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    <div>Baseado em {pedido.produtos.length} produto(s):</div>
                                    <div className="ml-2">
                                      {pedido.produtos.map((produto, idx) => (
                                        <div key={idx}>
                                          • {produto.tipo_produto || 'Produto'} 
                                          {produto.quantidade > 1 && ` (${produto.quantidade}x)`}
                                          {produto.cor && tipoOrdem.key === 'pintura' && ` - ${produto.cor}`}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {pedidos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Nenhum pedido encontrado</div>
        </div>
      )}
    </div>
  );
}