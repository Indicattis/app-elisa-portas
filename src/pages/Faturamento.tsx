import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Search, DollarSign, TrendingUp, Users, Plus, Filter, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RequisicoesVenda } from "@/components/RequisicoesVenda";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Venda {
  id: string;
  data_venda: string;
  atendente_nome: string;
  publico_alvo: string | null;
  canal_aquisicao: string;
  estado: string | null;
  cidade: string | null;
  cep: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  cliente_email: string | null;
  valor_produto: number;
  custo_produto: number;
  valor_pintura: number;
  custo_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  valor_venda: number;
  lucro_total: number;
  resgate: boolean;
}

interface VendaStats {
  totalVendas: number;
  faturamentoTotal: number;
  lucroTotal: number;
  ticketMedio: number;
  vendasMes: number;
  faturamentoMes: number;
}

export default function Faturamento() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [stats, setStats] = useState<VendaStats>({
    totalVendas: 0,
    faturamentoTotal: 0,
    lucroTotal: 0,
    ticketMedio: 0,
    vendasMes: 0,
    faturamentoMes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublico, setFilterPublico] = useState("todos");
  const [filterResgate, setFilterResgate] = useState("todos");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { isAdmin, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin || userRole === 'gerente_comercial') {
      fetchVendas();
      fetchStats();
    }
  }, [isAdmin, userRole, selectedMonth, selectedYear]);

  const fetchVendas = async () => {
    try {
      let query = supabase
        .from("vendas")
        .select(`
          id,
          data_venda,
          atendente_id,
          publico_alvo,
          canal_aquisicao,
          estado,
          cidade,
          cep,
          cliente_nome,
          cliente_telefone,
          cliente_email,
          valor_produto,
          custo_produto,
          valor_pintura,
          custo_pintura,
          valor_instalacao,
          valor_frete,
          valor_venda,
          lucro_total,
          resgate
        `)
        .order("data_venda", { ascending: false });

      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
      
      query = query
        .gte("data_venda", startDate.toISOString())
        .lte("data_venda", endDate.toISOString());

      const { data: vendasData, error } = await query;

      if (error) throw error;

      if (!vendasData || vendasData.length === 0) {
        setVendas([]);
        return;
      }

      // Buscar nomes dos atendentes
      const atendenteIds = [...new Set(vendasData.map(venda => venda.atendente_id))];
      const { data: atendentesData } = await supabase
        .from("admin_users")
        .select("user_id, nome")
        .in("user_id", atendenteIds);

      const atendenteMap = new Map(atendentesData?.map(atendente => [atendente.user_id, atendente.nome]) || []);

      const vendasCompletas = vendasData.map((venda) => ({
        ...venda,
        atendente_nome: atendenteMap.get(venda.atendente_id) || "Atendente não encontrado",
      }));

      setVendas(vendasCompletas);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Stats para o mês atual
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

      const { data: vendasMes, error: errorMes } = await supabase
        .from("vendas")
        .select("valor_produto, valor_pintura, valor_instalacao, valor_frete, lucro_total")
        .gte("data_venda", startDate.toISOString())
        .lte("data_venda", endDate.toISOString());

      // Stats gerais (todos os dados)
      const { data: vendasTotais, error: errorTotal } = await supabase
        .from("vendas")
        .select("valor_produto, valor_pintura, valor_instalacao, valor_frete, lucro_total");

      if (errorMes || errorTotal) throw errorMes || errorTotal;

      const vendasMesCount = vendasMes?.length || 0;
      const faturamentoMes = vendasMes?.reduce((acc, venda) => 
        acc + (venda.valor_produto || 0) + (venda.valor_pintura || 0) + 
        (venda.valor_instalacao || 0) + (venda.valor_frete || 0), 0) || 0;

      const totalVendas = vendasTotais?.length || 0;
      const faturamentoTotal = vendasTotais?.reduce((acc, venda) => 
        acc + (venda.valor_produto || 0) + (venda.valor_pintura || 0) + 
        (venda.valor_instalacao || 0) + (venda.valor_frete || 0), 0) || 0;
      const lucroTotal = vendasTotais?.reduce((acc, venda) => acc + (venda.lucro_total || 0), 0) || 0;
      const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;

      setStats({
        totalVendas,
        faturamentoTotal,
        lucroTotal,
        ticketMedio,
        vendasMes: vendasMesCount,
        faturamentoMes,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const handleDeleteVenda = async (vendaId: string) => {
    try {
      const { error } = await supabase
        .from("vendas")
        .delete()
        .eq("id", vendaId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Venda excluída com sucesso",
      });

      fetchVendas();
      fetchStats();
    } catch (error) {
      console.error("Erro ao excluir venda:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao excluir venda",
      });
    }
  };

  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = 
      (venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.cidade?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPublico = filterPublico === "todos" || venda.publico_alvo === filterPublico;
    const matchesResgate = filterResgate === "todos" || 
      (filterResgate === "sim" ? venda.resgate : !venda.resgate);

    return matchesSearch && matchesPublico && matchesResgate;
  });

  const meses = [
    { value: 1, label: "Janeiro" }, { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" }, { value: 4, label: "Abril" },
    { value: 5, label: "Maio" }, { value: 6, label: "Junho" },
    { value: 7, label: "Julho" }, { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" }, { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" }, { value: 12, label: "Dezembro" },
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (!isAdmin && userRole !== 'gerente_comercial') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground">
            Esta página requer permissões de administrador ou gerente comercial.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">
            Gestão de vendas e controle financeiro
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/dashboard/vendas/nova")} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Venda
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/vendas/vincular")} size="sm">
            Vincular Lead
          </Button>
        </div>
      </div>

      <Tabs defaultValue="vendas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="requisicoes">Requisições</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vendasMes}</div>
                <p className="text-xs text-muted-foreground">
                  {meses.find(m => m.value === selectedMonth)?.label}/{selectedYear}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Mês</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {stats.faturamentoMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita do período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {stats.lucroTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Margem de lucro
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {stats.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor médio por venda
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Vendas</CardTitle>
                  <CardDescription>
                    {filteredVendas.length} vendas encontradas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map((mes) => (
                        <SelectItem key={mes.value} value={mes.value.toString()}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anos.map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente, atendente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <Select value={filterPublico} onValueChange={setFilterPublico}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Público" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="serralheiro">Serralheiro</SelectItem>
                    <SelectItem value="cliente_final">Cliente Final</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterResgate} onValueChange={setFilterResgate}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Resgate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sim">Resgate</SelectItem>
                    <SelectItem value="nao">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Atendente</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Público</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Produto</TableHead>
                      <TableHead className="text-right">Pintura</TableHead>
                      <TableHead className="text-right">Instalação</TableHead>
                      <TableHead className="text-right">Frete</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendas.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell>
                          {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {venda.atendente_nome}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{venda.cliente_nome}</p>
                            <p className="text-sm text-muted-foreground">{venda.cliente_telefone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {venda.publico_alvo && (
                            <Badge variant={venda.publico_alvo === 'serralheiro' ? 'default' : 'secondary'}>
                              {venda.publico_alvo === 'serralheiro' ? 'Serralheiro' : 'Cliente Final'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{venda.canal_aquisicao}</Badge>
                        </TableCell>
                        <TableCell>
                          {venda.cidade && venda.estado ? `${venda.cidade}, ${venda.estado}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(venda.valor_produto || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(venda.valor_pintura || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(venda.valor_instalacao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {(venda.valor_frete || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {((venda.valor_produto || 0) + (venda.valor_pintura || 0) + 
                            (venda.valor_instalacao || 0) + (venda.valor_frete || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={venda.lucro_total > 0 ? "text-green-600 font-medium" : "text-red-600"}>
                            R$ {(venda.lucro_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {venda.resgate && (
                            <Badge variant="destructive">Resgate</Badge>
                          )}
                        </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             {isAdmin && (
                               <Button 
                                 variant="ghost" 
                                 size="sm"
                                 onClick={() => navigate(`/dashboard/vendas/editar/${venda.id}`)}
                               >
                                 <Edit className="w-4 h-4" />
                               </Button>
                             )}
                             {isAdmin && (
                               <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                   <Button variant="ghost" size="sm">
                                     <Trash2 className="w-4 h-4 text-red-500" />
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
                                     <AlertDialogAction onClick={() => handleDeleteVenda(venda.id)}>
                                       Excluir
                                     </AlertDialogAction>
                                   </AlertDialogFooter>
                                 </AlertDialogContent>
                               </AlertDialog>
                             )}
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requisicoes">
          <RequisicoesVenda />
        </TabsContent>
      </Tabs>
    </div>
  );
}