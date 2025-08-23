import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  produtos: any[];
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

export default function Pedidos() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pedidos_producao")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPedidos((data || []).map(pedido => ({
        ...pedido,
        produtos: Array.isArray(pedido.produtos) ? pedido.produtos : []
      })));
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar pedidos",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

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
                <TableRow key={pedido.id}>
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