import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendas } from '@/hooks/useVendas';
import { useAuth } from '@/hooks/useAuth';
import { ProductIconsSummary } from '@/components/vendas/ProductIconsSummary';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Pencil, Trash2, Search, DollarSign, ShoppingCart, Package, FileDown, CalendarIcon, Trophy, TrendingUp, FileText, X, Edit, DoorClosed, Home } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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
  
  // Estados para filtros avançados
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedAtendente, setSelectedAtendente] = useState<string>("todos");
  const [sortByValue, setSortByValue] = useState<'desc' | 'asc' | 'none'>('none');
  const [filterPrevisaoEntrega, setFilterPrevisaoEntrega] = useState<DateRange | undefined>();
  const [atendentes, setAtendentes] = useState<any[]>([]);

  // Buscar lista de atendentes
  useEffect(() => {
    const fetchAtendentes = async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('id, nome, user_id')
        .eq('ativo', true)
        .order('nome');
      if (data) setAtendentes(data);
    };
    fetchAtendentes();
  }, []);

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
        quantidade_produtos: venda.produtos?.length || 0,
        valor_venda: venda.valor_venda || 0,
        atendente_nome: venda.atendente?.nome || 'Não informado'
      })) || [];

      generateVendasRelatorioPDF({
        vendas: vendasParaRelatorio,
        stats,
        filtros: {
          minhasVendas: selectedAtendente !== 'todos',
          vendasMesAtual: false,
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
    let result = vendas?.filter(venda => {
      // Filtro de busca textual
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        venda.cliente_nome?.toLowerCase().includes(search) ||
        venda.cliente_telefone?.toLowerCase().includes(search) ||
        venda.cidade?.toLowerCase().includes(search) ||
        venda.estado?.toLowerCase().includes(search)
      );

      // Filtro de período de data
      if (dateRange?.from && dateRange?.to) {
        const dataVenda = new Date(venda.data_venda);
        if (dataVenda < dateRange.from || dataVenda > dateRange.to) return false;
      }

      // Filtro por atendente
      if (selectedAtendente !== "todos" && venda.atendente_id !== selectedAtendente) {
        return false;
      }

      // Filtro de previsão de entrega
      if (filterPrevisaoEntrega?.from && filterPrevisaoEntrega?.to && venda.data_prevista_entrega) {
        const previsao = new Date(venda.data_prevista_entrega);
        if (previsao < filterPrevisaoEntrega.from || previsao > filterPrevisaoEntrega.to) {
          return false;
        }
      }

      return matchesSearch;
    }) || [];

    // Ordenação por valor
    if (sortByValue !== 'none') {
      result = [...result].sort((a, b) => {
        const valorA = a.valor_venda || 0;
        const valorB = b.valor_venda || 0;
        return sortByValue === 'desc' ? valorB - valorA : valorA - valorB;
      });
    }

    return result;
  }, [vendas, searchTerm, dateRange, selectedAtendente, sortByValue, filterPrevisaoEntrega]);

  // Estatísticas baseadas nos filtros (excluindo frete)
  const stats = useMemo(() => {
    if (!filteredVendas) return { totalVendas: 0, totalValor: 0, totalProdutos: 0 };
    
    return {
      totalVendas: filteredVendas.length,
      totalValor: filteredVendas.reduce((sum, v) => {
        // Calcula o valor sem frete: valor_venda - valor_frete
        const valorSemFrete = (v.valor_venda || 0) - (v.valor_frete || 0);
        return sum + valorSemFrete;
      }, 0),
      totalProdutos: filteredVendas.reduce((sum, v) => sum + (v.produtos?.length || 0), 0),
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
    <div className="container mx-auto py-3 px-3 sm:p-6 space-y-3 sm:space-y-6 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Vendas</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Gerencie suas vendas e faturamentos</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => navigate('/dashboard/vendas/forca-vendas')} className="h-8 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-initial">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">Força</span>
          </Button>
          <Button variant="outline" onClick={handleExportarPDF} className="h-8 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-initial">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">PDF</span>
          </Button>
          <Button onClick={() => navigate('/dashboard/vendas/nova')} className="h-8 sm:h-10 text-xs sm:text-sm flex-1 sm:flex-initial">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline ml-2">Nova</span>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Card className="flex-1">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Vendas</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalVendas}</p>
            </div>
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Valor</p>
              <p className="text-base sm:text-xl font-bold">{formatCurrency(stats.totalValor)}</p>
            </div>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Itens</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalProdutos}</p>
            </div>
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-full overflow-hidden">
        <CardContent className="p-2 sm:p-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* Busca - ocupa 2 colunas no mobile */}
            <div className="col-span-2 sm:col-span-1">
              <div className="relative w-full">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 h-8 text-xs w-full"
                />
              </div>
            </div>

            {/* Período */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium truncate">Período</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-8 justify-start text-left font-normal text-[10px]"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM", { locale: ptBR })}-{format(dateRange.to, "dd/MM", { locale: ptBR })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM", { locale: ptBR })
                        )
                      ) : (
                        "Período"
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Vendedor */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium truncate">Vendedor</label>
              <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
                <SelectTrigger className="h-8 text-[10px] z-50 bg-background">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  <SelectItem value="todos">Todos</SelectItem>
                  {atendentes.map((atendente) => (
                    <SelectItem key={atendente.user_id} value={atendente.user_id}>
                      {atendente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium truncate">Ordenar</label>
              <Select value={sortByValue} onValueChange={(v) => setSortByValue(v as any)}>
                <SelectTrigger className="h-8 text-[10px] z-50 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  <SelectItem value="none">Data</SelectItem>
                  <SelectItem value="desc">Maior</SelectItem>
                  <SelectItem value="asc">Menor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Previsão */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium truncate">Previsão</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-8 justify-start text-left font-normal text-[10px]"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {filterPrevisaoEntrega?.from ? (
                        filterPrevisaoEntrega.to ? (
                          <>
                            {format(filterPrevisaoEntrega.from, "dd/MM", { locale: ptBR })}-{format(filterPrevisaoEntrega.to, "dd/MM", { locale: ptBR })}
                          </>
                        ) : (
                          format(filterPrevisaoEntrega.from, "dd/MM", { locale: ptBR })
                        )
                      ) : (
                        "Previsão"
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={filterPrevisaoEntrega}
                    onSelect={setFilterPrevisaoEntrega}
                    numberOfMonths={1}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Botão Limpar - aparece somente quando há filtros ativos */}
            {(dateRange?.from || selectedAtendente !== "todos" || sortByValue !== "none" || filterPrevisaoEntrega?.from) && (
              <div className="col-span-2 sm:col-span-1 flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDateRange(undefined);
                    setSelectedAtendente("todos");
                    setSortByValue("none");
                    setFilterPrevisaoEntrega(undefined);
                  }}
                  className="h-8 text-[10px] w-full"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-full overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">

            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  {/* Mobile: 2 colunas */}
                  <TableHead className="text-xs sm:text-sm md:hidden">Cliente</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right md:hidden">Valor/Ações</TableHead>
                  {/* Desktop: todas as colunas alinhadas com as células */}
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">Data</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">Cliente</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">CPF</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">Cidade/Estado</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">Previsão</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">Produtos</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm text-center">VP</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm text-right">Valor Total</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm text-right">Com Frete</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm">Atendente</TableHead>
                  <TableHead className="hidden md:table-cell text-xs sm:text-sm text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendas?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVendas?.map((venda) => {
                    const canEdit = isAdmin || venda.atendente_id === userRole?.user_id;
                    
                    return (
                      <TableRow key={venda.id}>
                        {/* Mobile: Coluna 1 - Cliente + Info */}
                        <TableCell className="py-2 px-2 sm:py-4 sm:px-4 md:hidden">
                          <div className="space-y-1">
                            <div className="font-medium text-xs truncate max-w-[150px]">{venda.cliente_nome}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {format(new Date(venda.data_venda), "dd/MM/yy", { locale: ptBR })}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                              {venda.cidade}/{venda.estado}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <ProductIconsSummary venda={venda} />
                              {venda.atendente && (
                                <Avatar className="h-4 w-4 ml-1">
                                  <AvatarImage src={venda.atendente?.foto_perfil_url || ''} />
                                  <AvatarFallback className="text-[8px]">
                                    {venda.atendente?.nome?.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Mobile: Coluna 2 - Valor + Ações */}
                        <TableCell className="py-2 px-2 sm:py-4 sm:px-4 md:hidden text-right">
                          <div className="space-y-1">
                            <div className="font-bold text-xs">{formatCurrency(venda.valor_venda || 0)}</div>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/dashboard/vendas/${venda.id}/view`)}
                                className="h-7 w-7"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/dashboard/vendas/${venda.id}/editar`)}
                                  className="h-7 w-7"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Desktop: Todas as colunas */}
                        <TableCell className="hidden md:table-cell text-sm">
                          {format(new Date(venda.data_venda), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-medium">{venda.cliente_nome}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{venda.cpf_cliente || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{venda.cliente_telefone}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{venda.cidade}/{venda.estado}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {venda.data_prevista_entrega 
                            ? format(new Date(venda.data_prevista_entrega), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <ProductIconsSummary venda={venda} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center">
                          {venda.venda_presencial ? (
                            <Badge variant="default" className="text-xs">Sim</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-semibold text-right">
                          {formatCurrency((venda.valor_venda || 0) - (venda.valor_frete || 0))}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-bold text-right">
                          {formatCurrency(venda.valor_venda || 0)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={venda.atendente?.foto_perfil_url || ''} alt={venda.atendente?.nome || 'Atendente'} />
                              <AvatarFallback className="text-xs">
                                {venda.atendente?.nome?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{venda.atendente?.nome || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/dashboard/vendas/${venda.id}/view`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canEdit && (
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
