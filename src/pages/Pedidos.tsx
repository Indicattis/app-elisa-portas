import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
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
  cliente_nome: string;
  cliente_telefone: string;
  produto_tipo: string;
  produto_cor: string;
  status: string;
  created_at: string;
  data_entrega: string;
  observacoes: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_cep: string;
  produto_largura: string;
  produto_altura: string;
  venda_id: string;
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
      setPedidos(data || []);
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
      // Buscar dados da venda relacionada para pegar informações de pagamento
      let vendaData = null;
      if (pedido.venda_id) {
        const { data: venda } = await supabase
          .from("vendas")
          .select("*")
          .eq("id", pedido.venda_id)
          .single();
        vendaData = venda;
      }

      generatePedidoPDF({
        pedido,
        vendaData
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
                        {pedido.cliente_telefone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{pedido.produto_tipo}</div>
                      <div className="text-sm text-muted-foreground">
                        {pedido.produto_largura} x {pedido.produto_altura} - {pedido.produto_cor}
                      </div>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(pedido)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
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