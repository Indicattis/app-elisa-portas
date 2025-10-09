import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendas } from '@/hooks/useVendas';
import { useAuth } from '@/hooks/useAuth';
import { VendaDetailsModal } from '@/components/vendas/VendaDetailsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Eye, Pencil, Trash2, Search, DollarSign, ShoppingCart, Package, FileDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { generateVendasRelatorioPDF } from '@/utils/vendasPDFGenerator';
import { useToast } from '@/hooks/use-toast';

export default function Vendas() {
  const navigate = useNavigate();
  const { isAdmin, userRole } = useAuth();
  const { vendas, isLoading, deleteVenda } = useVendas();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroMinhasVendas, setFiltroMinhasVendas] = useState(true);
  const [filtroVendasMes, setFiltroVendasMes] = useState(true);
  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleExportarPDF = () => {
    try {
      const vendasParaRelatorio = filteredVendas?.map(venda => ({
        data_venda: venda.data_venda,
        cliente_nome: venda.cliente_nome,
        cliente_telefone: venda.cliente_telefone || '',
        cidade: venda.cidade,
        estado: venda.estado,
        previsao_entrega: venda.data_prevista_entrega || '',
        quantidade_portas: venda.portas?.length || 0,
        valor_venda: venda.valor_venda || 0,
        atendente_nome: venda.atendente?.nome || 'Não informado'
      })) || [];

      generateVendasRelatorioPDF({
        vendas: vendasParaRelatorio,
        stats,
        filtros: {
          minhasVendas: filtroMinhasVendas,
          vendasMesAtual: filtroVendasMes,
          busca: searchTerm
        }
      });

      toast({
        title: "Relatório gerado",
        description: "O relatório foi exportado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao exportar o relatório.",
        variant: "destructive",
      });
    }
  };

  const filteredVendas = useMemo(() => {
    return vendas?.filter(venda => {
      // Filtro de busca textual
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        venda.cliente_nome?.toLowerCase().includes(search) ||
        venda.cliente_telefone?.toLowerCase().includes(search) ||
        venda.cidade?.toLowerCase().includes(search) ||
        venda.estado?.toLowerCase().includes(search)
      );

      // Filtro "Minhas Vendas"
      const matchesMinhasVendas = !filtroMinhasVendas || venda.atendente_id === userRole?.user_id;

      // Filtro "Vendas deste mês"
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje);
      const fimMes = endOfMonth(hoje);
      const dataVenda = new Date(venda.data_venda);
      const matchesVendasMes = !filtroVendasMes || (dataVenda >= inicioMes && dataVenda <= fimMes);

      return matchesSearch && matchesMinhasVendas && matchesVendasMes;
    });
  }, [vendas, searchTerm, filtroMinhasVendas, filtroVendasMes, userRole?.id]);

  // Estatísticas baseadas nos filtros (excluindo frete)
  const stats = useMemo(() => {
    if (!filteredVendas) return { totalVendas: 0, totalValor: 0, totalPortas: 0 };
    
    return {
      totalVendas: filteredVendas.length,
      totalValor: filteredVendas.reduce((sum, v) => {
        // Calcula o valor sem frete: valor_venda - valor_frete
        const valorSemFrete = (v.valor_venda || 0) - (v.valor_frete || 0);
        return sum + valorSemFrete;
      }, 0),
      totalPortas: filteredVendas.reduce((sum, v) => sum + (v.portas?.length || 0), 0),
    };
  }, [filteredVendas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vendas</h1>
        <div className="flex gap-2">
          <Button onClick={handleExportarPDF} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Exportar Relatório PDF
          </Button>
          <Button onClick={() => navigate('/dashboard/vendas/nova')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValor)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Portas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPortas}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-4">
            {/* Filtros Rápidos */}
            <div className="flex gap-6 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="minhas-vendas"
                  checked={filtroMinhasVendas}
                  onCheckedChange={(checked) => setFiltroMinhasVendas(checked as boolean)}
                />
                <Label htmlFor="minhas-vendas" className="cursor-pointer">
                  Minhas vendas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="vendas-mes"
                  checked={filtroVendasMes}
                  onCheckedChange={(checked) => setFiltroVendasMes(checked as boolean)}
                />
                <Label htmlFor="vendas-mes" className="cursor-pointer">
                  Vendas deste mês
                </Label>
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por cliente, telefone, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade/Estado</TableHead>
                  <TableHead>Previsão Entrega</TableHead>
                  <TableHead className="text-center">Qtd Portas</TableHead>
                  <TableHead className="text-center">Nota Fiscal</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Valor Total c/ Frete</TableHead>
                  <TableHead>Atendente</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendas?.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell>
                        {format(new Date(venda.data_venda), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{venda.cliente_nome}</TableCell>
                      <TableCell>{venda.cliente_telefone}</TableCell>
                      <TableCell>{venda.cidade}/{venda.estado}</TableCell>
                      <TableCell>
                        {venda.data_prevista_entrega 
                          ? format(new Date(venda.data_prevista_entrega), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-center">{venda.portas?.length || 0}</TableCell>
                      <TableCell className="text-center">
                        {venda.nota_fiscal ? (
                          <span className="text-green-600 font-medium">Sim</span>
                        ) : (
                          <span className="text-muted-foreground">Não</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency((venda.valor_venda || 0) - (venda.valor_frete || 0))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(venda.valor_venda || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={venda.atendente?.foto_perfil_url || ''} alt={venda.atendente?.nome || 'Atendente'} />
                            <AvatarFallback>
                              {venda.atendente?.nome?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{venda.atendente?.nome || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedVenda(venda);
                              setDetailsModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(isAdmin || venda.atendente_id === userRole?.user_id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/dashboard/vendas/${venda.id}/editar`)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteVenda(venda.id)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <VendaDetailsModal 
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        venda={selectedVenda}
      />
    </div>
  );
}
