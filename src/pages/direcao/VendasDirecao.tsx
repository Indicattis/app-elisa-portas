import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendas } from '@/hooks/useVendas';
import { useAuth } from '@/hooks/useAuth';
import { useColumnConfig, ColumnConfig } from '@/hooks/useColumnConfig';
import { ProductIconsSummary } from '@/components/vendas/ProductIconsSummary';
import { ColumnManager } from '@/components/ColumnManager';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, DollarSign, ShoppingCart, Package, CalendarIcon, Download, FileText, FileSpreadsheet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { generateVendasRelatorioPDF } from '@/utils/vendasPDFGenerator';
import { useToast } from '@/hooks/use-toast';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Definição das colunas disponíveis
const COLUNAS_DISPONIVEIS: ColumnConfig[] = [
  { id: 'data', label: 'Data', defaultVisible: true },
  { id: 'cliente', label: 'Cliente', defaultVisible: true },
  { id: 'telefone', label: 'Telefone', defaultVisible: false },
  { id: 'cidade', label: 'Cidade', defaultVisible: true },
  { id: 'estado', label: 'Estado', defaultVisible: false },
  { id: 'vendedor', label: 'Vendedor', defaultVisible: true },
  { id: 'produtos', label: 'Produtos', defaultVisible: true },
  { id: 'previsao', label: 'Previsão Entrega', defaultVisible: false },
  { id: 'valor', label: 'Valor', defaultVisible: true },
];

export default function VendasDirecao() {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { vendas, isLoading } = useVendas();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedAtendente, setSelectedAtendente] = useState<string>("todos");
  const [atendentes, setAtendentes] = useState<any[]>([]);

  // Hook de configuração de colunas
  const {
    columns,
    visibleColumns,
    visibleIds,
    toggleColumn,
    setColumnOrder,
    resetColumns
  } = useColumnConfig('direcao_vendas_columns', COLUNAS_DISPONIVEIS);

  useEffect(() => {
    const fetchAtendentes = async () => {
      const { data } = await supabase
        .from('admin_users')
        .select('id, nome, user_id')
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

  const handleExportarExcel = () => {
    try {
      const dadosExcel = filteredVendas?.map(venda => ({
        'Data Venda': format(new Date(venda.data_venda), 'dd/MM/yyyy', { locale: ptBR }),
        'Cliente': venda.cliente_nome,
        'Telefone': venda.cliente_telefone || '-',
        'Cidade': venda.cidade,
        'Estado': venda.estado,
        'Qtd Produtos': venda.produtos?.length || 0,
        'Valor Total': (venda.valor_venda || 0) + (venda.valor_credito || 0),
        'Vendedor': venda.atendente?.nome || 'Não informado',
      })) || [];

      const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
      
      const fileName = `vendas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Excel gerado",
        description: `Arquivo ${fileName} exportado com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro ao gerar Excel",
        description: "Ocorreu um erro ao exportar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const filteredVendas = useMemo(() => {
    let result = vendas?.filter(venda => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || (
        venda.cliente_nome?.toLowerCase().includes(search) ||
        venda.cliente_telefone?.toLowerCase().includes(search) ||
        venda.cidade?.toLowerCase().includes(search)
      );

      if (dateRange?.from && dateRange?.to) {
        const dataVenda = new Date(venda.data_venda);
        if (dataVenda < dateRange.from || dataVenda > dateRange.to) return false;
      }

      if (selectedAtendente !== "todos" && venda.atendente_id !== selectedAtendente) {
        return false;
      }

      return matchesSearch;
    }) || [];

    return result;
  }, [vendas, searchTerm, dateRange, selectedAtendente]);

  const stats = useMemo(() => {
    if (!filteredVendas) return { totalVendas: 0, totalValor: 0, totalProdutos: 0 };
    
    return {
      totalVendas: filteredVendas.length,
      totalValor: filteredVendas.reduce((sum, v) => {
        const valorSemFrete = (v.valor_venda || 0) - (v.valor_frete || 0) + (v.valor_credito || 0);
        return sum + valorSemFrete;
      }, 0),
      totalProdutos: filteredVendas.reduce((sum, v) => sum + (v.produtos?.length || 0), 0),
    };
  }, [filteredVendas]);

  // Função para renderizar célula baseado no ID da coluna
  const renderCell = useCallback((venda: any, columnId: string) => {
    switch (columnId) {
      case 'data':
        return (
          <span className="text-white/80">
            {format(new Date(venda.data_venda), 'dd/MM/yy', { locale: ptBR })}
          </span>
        );
      case 'cliente':
        return <span className="text-white font-medium">{venda.cliente_nome}</span>;
      case 'telefone':
        return <span className="text-white/60">{venda.cliente_telefone || '-'}</span>;
      case 'cidade':
        return <span className="text-white/60">{venda.cidade}/{venda.estado}</span>;
      case 'estado':
        return <span className="text-white/60">{venda.estado}</span>;
      case 'vendedor':
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={venda.atendente?.foto_perfil_url} />
              <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-400">
                {venda.atendente?.nome?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white/80 text-sm">{venda.atendente?.nome}</span>
          </div>
        );
      case 'produtos':
        return <ProductIconsSummary venda={venda} />;
      case 'previsao':
        return (
          <span className="text-white/60">
            {venda.data_prevista_entrega 
              ? format(new Date(venda.data_prevista_entrega), 'dd/MM/yy', { locale: ptBR })
              : '-'
            }
          </span>
        );
      case 'valor':
        return (
          <span className="text-white font-medium">
            {formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}
          </span>
        );
      default:
        return null;
    }
  }, []);

  // Estilo de alinhamento por coluna
  const getColumnAlignment = (columnId: string) => {
    if (columnId === 'valor') return 'text-right';
    return 'text-left';
  };

  // Classes responsivas por coluna
  const getColumnResponsiveClass = (columnId: string) => {
    switch (columnId) {
      case 'cidade':
      case 'estado':
      case 'telefone':
        return 'hidden md:table-cell';
      case 'vendedor':
      case 'previsao':
        return 'hidden lg:table-cell';
      default:
        return '';
    }
  };

  const headerActions = (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10">
          <DropdownMenuItem onClick={handleExportarPDF} className="text-white hover:bg-white/10">
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportarExcel} className="text-white hover:bg-white/10">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button 
        onClick={() => navigate('/dashboard/vendas/nova')} 
        size="sm"
        className="bg-blue-600 hover:bg-blue-500"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <MinimalistLayout title="Vendas" backPath="/direcao">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </MinimalistLayout>
    );
  }

  return (
    <MinimalistLayout 
      title="Vendas" 
      subtitle="Todas as vendas do período"
      backPath="/direcao"
      headerActions={headerActions}
    >
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Vendas</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalVendas}</p>
            </div>
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-white/40" />
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Valor</p>
              <p className="text-base sm:text-xl font-bold text-white">{formatCurrency(stats.totalValor)}</p>
            </div>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white/40" />
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Itens</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalProdutos}</p>
            </div>
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white/40" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar cliente, telefone, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-primary/5 border-primary/10 text-white placeholder:text-white/40"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-primary/5 border-primary/10 text-white hover:bg-primary/10">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-zinc-900 border-primary/10" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
              className="text-white"
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
          <SelectTrigger className="w-[180px] bg-primary/5 border-primary/10 text-white">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-primary/10">
            <SelectItem value="todos" className="text-white">Todos</SelectItem>
            {atendentes.map(atendente => (
              <SelectItem key={atendente.user_id} value={atendente.user_id} className="text-white">
                {atendente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Botão de configuração de colunas */}
        <ColumnManager
          columns={columns}
          visibleIds={visibleIds}
          onToggle={toggleColumn}
          onReorder={setColumnOrder}
          onReset={resetColumns}
        />
      </div>

      {/* Tabela */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl overflow-hidden backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/10 hover:bg-transparent">
              {visibleColumns.map(column => (
                <TableHead 
                  key={column.id}
                  className={`text-white/60 ${getColumnAlignment(column.id)} ${getColumnResponsiveClass(column.id)}`}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-white/40">
                  Nenhuma venda encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredVendas.map((venda) => (
                <TableRow 
                  key={venda.id} 
                  className="border-primary/10 hover:bg-primary/5 cursor-pointer"
                  onClick={() => navigate(`/dashboard/vendas/${venda.id}`)}
                >
                  {visibleColumns.map(column => (
                    <TableCell 
                      key={column.id}
                      className={`${getColumnAlignment(column.id)} ${getColumnResponsiveClass(column.id)}`}
                    >
                      {renderCell(venda, column.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </MinimalistLayout>
  );
}
