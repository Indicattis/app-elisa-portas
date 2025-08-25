import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePedidos } from "@/hooks/usePedidos";
import { baixarPDFOrdem } from "@/utils/ordemPDFGenerator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  ordens_separacao?: any[];
  ordens_perfiladeira?: any[];
  ordens_soldagem?: any[];
  ordens_pintura?: any[];
  status_ordens?: any;
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
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
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

  const handleViewOrdens = async (pedido: Pedido) => {
    setSelectedPedido(pedido);
    if (!ordensProducao[pedido.id]) {
      await fetchOrdensProducao(pedido.id);
    }
    setModalOpen(true);
  };

  const fetchOrdensProducao = async (pedidoId: string) => {
    try {
      // Buscar linhas de ordens agrupadas por tipo
      const { data: linhasOrdens, error } = await supabase
        .from("linhas_ordens")
        .select("*")
        .eq("pedido_id", pedidoId);

      if (error) throw error;

      // Agrupar por tipo de ordem
      const ordensData = {
        soldagem: linhasOrdens?.filter(linha => linha.tipo_ordem === 'soldagem') || [],
        pintura: linhasOrdens?.filter(linha => linha.tipo_ordem === 'pintura') || [],
        separacao: linhasOrdens?.filter(linha => linha.tipo_ordem === 'separacao') || [],
        perfiladeira: linhasOrdens?.filter(linha => linha.tipo_ordem === 'perfiladeira') || [],
        instalacao: linhasOrdens?.filter(linha => linha.tipo_ordem === 'instalacao') || [],
      };

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

  const handleDownloadOrdemPDF = async (pedido: Pedido, tipoOrdem: string) => {
    try {
      // Buscar as informações das ordens do pedido
      const { data: pedidoCompleto, error } = await supabase
        .from("pedidos_producao")
        .select("*")
        .eq("id", pedido.id)
        .single();

      if (error) throw error;

      const campoOrdem = `ordens_${tipoOrdem}`;
      const ordensInfo = pedidoCompleto[campoOrdem];

      if (!ordensInfo || ordensInfo.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: `Nenhuma ordem de ${tipoOrdem} encontrada para este pedido`,
        });
        return;
      }

      // Dados do pedido para o PDF
      const dadosPedido = {
        numero_pedido: pedido.numero_pedido,
        cliente_nome: pedido.cliente_nome,
        cliente_telefone: pedido.cliente_telefone,
        endereco_rua: pedido.endereco_rua,
        endereco_numero: pedido.endereco_numero,
        endereco_cidade: pedido.endereco_cidade,
        endereco_estado: pedido.endereco_estado,
      };

      // Gerar PDF com as informações das ordens
      baixarPDFOrdem(tipoOrdem, ordensInfo, dadosPedido);

      toast({
        title: "Sucesso",
        description: `PDF da ordem de ${tipoOrdem} gerado com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao gerar PDF da ordem:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao gerar PDF da ordem de ${tipoOrdem}`,
      });
    }
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
                <TableHead>Status</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow 
                  key={pedido.id}
                  className="cursor-pointer hover:bg-muted/50 h-[35px]"
                  onDoubleClick={() => handleViewOrdens(pedido)}
                >
                  <TableCell className="py-1">
                    <Badge className={statusColors[pedido.status as keyof typeof statusColors]}>
                      {statusLabels[pedido.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium py-1">
                    {pedido.numero_pedido}
                  </TableCell>
                  <TableCell className="py-1">
                    <div className="text-sm">
                      {pedido.produtos && pedido.produtos.length > 0 ? (
                        pedido.produtos.slice(0, 2).map((produto: any, index: number) => (
                          <div key={index}>
                            <span className="font-medium">{produto.tipo_produto || 'Produto'}</span>
                            {produto.cor && <span className="text-muted-foreground"> - {produto.cor}</span>}
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Sem produtos</span>
                      )}
                      {pedido.produtos && pedido.produtos.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{pedido.produtos.length - 2} mais
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-1">
                    {pedido.valor_venda && (
                      <div className="font-medium text-sm">
                        R$ {pedido.valor_venda.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-1 text-sm">
                    {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="py-1 text-sm">
                    {pedido.data_entrega 
                      ? new Date(pedido.data_entrega).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right py-1">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPedido(pedido);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadPDF(pedido);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
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

      {/* Modal de Visualização das Ordens */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ordens de Produção - Pedido {selectedPedido?.numero_pedido}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPedido && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tiposOrdem.map((tipoOrdem) => {
                  const ordensDoTipo = ordensProducao[selectedPedido.id]?.[tipoOrdem.key as keyof typeof ordensProducao[string]] || [];
                  
                  if (ordensDoTipo.length === 0) return null;
                  
                  return (
                    <div key={tipoOrdem.key} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-lg">{tipoOrdem.label}</h4>
                          <Badge variant="secondary">{ordensDoTipo.length} ordem(ns)</Badge>
                        </div>
                        
                        <div className="space-y-2">
                           {ordensDoTipo.map((linha: any, index: number) => (
                             <div 
                               key={linha.id} 
                               className="p-3 bg-background rounded border cursor-pointer hover:bg-muted/30 transition-colors"
                               onClick={() => handleDownloadOrdemPDF(selectedPedido, tipoOrdem.key)}
                             >
                               <div className="flex items-center justify-between">
                                 <div>
                                   <div className="font-medium text-sm">
                                     {linha.item}
                                   </div>
                                   <div className="text-xs text-muted-foreground">
                                     Qtd: {linha.quantidade} | Tamanho: {linha.tamanho}
                                   </div>
                                   <div className="text-xs text-muted-foreground">
                                     Criada em {new Date(linha.created_at).toLocaleDateString('pt-BR')}
                                   </div>
                                 </div>
                                 <Download className="w-4 h-4 text-muted-foreground" />
                               </div>
                             </div>
                           ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleDownloadOrdemPDF(selectedPedido, tipoOrdem.key)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar PDF {tipoOrdem.label}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {Object.values(ordensProducao[selectedPedido.id] || {}).every(ordens => ordens.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma ordem de produção encontrada para este pedido.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}