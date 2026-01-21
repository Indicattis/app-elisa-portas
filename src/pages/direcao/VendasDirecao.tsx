import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendas } from '@/hooks/useVendas';
import { useAuth } from '@/hooks/useAuth';
import { useColumnConfig, ColumnConfig } from '@/hooks/useColumnConfig';
import { ProductIconsSummary } from '@/components/vendas/ProductIconsSummary';
import { ColumnManager } from '@/components/ColumnManager';
import { FaturamentoMensalGrid } from '@/components/vendas/FaturamentoMensalGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, DollarSign, ShoppingCart, Package, CalendarIcon, Download, FileText, FileSpreadsheet, ArrowUpDown, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, setMonth, differenceInDays } from 'date-fns';
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
  { id: 'frete', label: 'Frete', defaultVisible: false },
  { id: 'instalacao', label: 'Instalação', defaultVisible: false },
  { id: 'desconto', label: 'Desconto', defaultVisible: false },
  { id: 'acrescimo', label: 'Acréscimo', defaultVisible: false },
  { id: 'faturada', label: 'Faturada', defaultVisible: false },
  { id: 'tempo_sem_faturar', label: 'Tempo s/ Faturar', defaultVisible: true },
  { id: 'valor', label: 'Valor', defaultVisible: true },
];

// Função para formatar tempo decorrido
const formatarTempoSemFaturar = (dias: number): string => {
  if (dias === 0) return 'Hoje';
  if (dias === 1) return '1 dia';
  if (dias < 7) return `${dias} dias`;
  if (dias < 30) {
    const semanas = Math.floor(dias / 7);
    return semanas === 1 ? '1 sem.' : `${semanas} sem.`;
  }
  const meses = Math.floor(dias / 30);
  return meses === 1 ? '1 mês' : `${meses} meses`;
};

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
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    column: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ column: null, direction: null });

  // Handler para clique no mês do grid
  const handleMonthClick = useCallback((monthIndex: number) => {
    const year = new Date().getFullYear();
    const monthDate = setMonth(new Date(year, 0, 1), monthIndex);
    const from = startOfMonth(monthDate);
    const to = endOfMonth(monthDate);
    
    if (selectedMonth === monthIndex) {
      // Se clicar no mesmo mês, reseta para o mês atual
      setSelectedMonth(null);
      setDateRange({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      });
    } else {
      setSelectedMonth(monthIndex);
      setDateRange({ from, to });
    }
  }, [selectedMonth]);

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

  // Ordenação das vendas
  const sortedVendas = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) {
      return filteredVendas;
    }
    
    return [...filteredVendas].sort((a, b) => {
      const getValue = (venda: any) => {
        switch (sortConfig.column) {
          case 'data': return new Date(venda.data_venda).getTime();
          case 'cliente': return venda.cliente_nome?.toLowerCase() || '';
          case 'cidade': return venda.cidade?.toLowerCase() || '';
          case 'estado': return venda.estado?.toLowerCase() || '';
          case 'vendedor': return venda.atendente?.nome?.toLowerCase() || '';
          case 'valor': return (venda.valor_venda || 0) + (venda.valor_credito || 0);
          case 'previsao': return venda.data_prevista_entrega 
            ? new Date(venda.data_prevista_entrega).getTime() 
            : 0;
          case 'telefone': return venda.cliente_telefone || '';
          case 'produtos': return venda.produtos?.length || 0;
          case 'frete': return venda.valor_frete || 0;
          case 'instalacao': return venda.valor_instalacao || 0;
          case 'desconto': return venda.produtos?.reduce((acc: number, p: any) => acc + (p.desconto_valor || 0), 0) || 0;
          case 'acrescimo': return venda.valor_credito || 0;
          case 'faturada': 
            const produtos = venda.produtos || [];
            return produtos.some((p: any) => p.faturamento === true) ? 1 : 0;
          case 'tempo_sem_faturar':
            const produtosTempo = venda.produtos || [];
            const estaFaturada = produtosTempo.some((p: any) => p.faturamento === true);
            if (estaFaturada) return 0;
            return differenceInDays(new Date(), new Date(venda.data_venda));
          default: return '';
        }
      };
      
      const aVal = getValue(a);
      const bVal = getValue(b);
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredVendas, sortConfig]);

  // Função para alternar ordenação
  const handleSort = useCallback((columnId: string) => {
    setSortConfig(current => {
      if (current.column !== columnId) {
        return { column: columnId, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { column: columnId, direction: 'desc' };
      }
      return { column: null, direction: null };
    });
  }, []);

  const stats = useMemo(() => {
    if (!filteredVendas) return { totalVendas: 0, totalValor: 0, totalPortasEnrolar: 0 };
    
    return {
      totalVendas: filteredVendas.length,
      totalValor: filteredVendas.reduce((sum, v) => {
        const valorSemFrete = (v.valor_venda || 0) - (v.valor_frete || 0) + (v.valor_credito || 0);
        return sum + valorSemFrete;
      }, 0),
      totalPortasEnrolar: filteredVendas.reduce((sum, v) => {
        const portasEnrolar = v.produtos?.filter((p: any) => p.tipo_produto === 'porta_enrolar') || [];
        return sum + portasEnrolar.reduce((acc: number, p: any) => acc + (p.quantidade || 1), 0);
      }, 0),
    };
  }, [filteredVendas]);

  // Função para renderizar célula baseado no ID da coluna
  const renderCell = useCallback((venda: any, columnId: string) => {
    // Calcular desconto total dos produtos
    const calcularDescontoTotal = () => {
      if (!venda.produtos) return 0;
      return venda.produtos.reduce((acc: number, p: any) => acc + (p.desconto_valor || 0), 0);
    };

    // Verificar se foi faturada (produtos com faturamento = true)
    const isFaturada = () => {
      if (!venda.produtos || venda.produtos.length === 0) return false;
      return venda.produtos.some((p: any) => p.faturamento === true);
    };

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
          <Avatar className="h-7 w-7">
            <AvatarImage src={venda.atendente?.foto_perfil_url} />
            <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-400">
              {venda.atendente?.nome?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
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
      case 'frete':
        return (
          <span className="text-white/60">
            {venda.valor_frete ? formatCurrency(venda.valor_frete) : '-'}
          </span>
        );
      case 'instalacao':
        return (
          <span className="text-white/60">
            {venda.valor_instalacao ? formatCurrency(venda.valor_instalacao) : '-'}
          </span>
        );
      case 'desconto':
        const desconto = calcularDescontoTotal();
        return (
          <span className={desconto > 0 ? "text-red-400" : "text-white/60"}>
            {desconto > 0 ? `-${formatCurrency(desconto)}` : '-'}
          </span>
        );
      case 'acrescimo':
        return (
          <span className={venda.valor_credito > 0 ? "text-green-400" : "text-white/60"}>
            {venda.valor_credito > 0 ? `+${formatCurrency(venda.valor_credito)}` : '-'}
          </span>
        );
      case 'faturada':
        const faturada = isFaturada();
        return (
          <div className="flex justify-center">
            {faturada ? (
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-400" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                <X className="w-3 h-3 text-white/30" />
              </div>
            )}
          </div>
        );
      case 'tempo_sem_faturar':
        if (isFaturada()) {
          return <span className="text-white/30">-</span>;
        }
        const diasSemFaturar = differenceInDays(new Date(), new Date(venda.data_venda));
        const tempoFormatado = formatarTempoSemFaturar(diasSemFaturar);
        // Cor baseada na urgência
        const corTempo = diasSemFaturar >= 30 
          ? 'text-red-400' 
          : diasSemFaturar >= 14 
            ? 'text-amber-400' 
            : 'text-white/60';
        return <span className={corTempo}>{tempoFormatado}</span>;
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

  // Classes responsivas por coluna
  const getColumnResponsiveClass = (columnId: string) => {
    switch (columnId) {
      case 'cidade':
      case 'estado':
      case 'telefone':
        return 'hidden md:table-cell';
      case 'vendedor':
      case 'previsao':
      case 'frete':
      case 'instalacao':
      case 'desconto':
      case 'acrescimo':
      case 'faturada':
      case 'tempo_sem_faturar':
        return 'hidden lg:table-cell';
      default:
        return '';
    }
  };

  // Estilo de alinhamento por coluna
  const getColumnAlignment = (columnId: string) => {
    switch (columnId) {
      case 'valor':
      case 'frete':
      case 'instalacao':
      case 'desconto':
      case 'acrescimo':
        return 'text-right';
      case 'faturada':
      case 'tempo_sem_faturar':
        return 'text-center';
      default:
        return 'text-left';
    }
  };

  const headerActions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
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
  );

  if (isLoading) {
    return (
      <MinimalistLayout 
        title="Vendas" 
        backPath="/direcao"
        breadcrumbItems={[
          { label: "Home", path: "/home" },
          { label: "Direção", path: "/direcao" },
          { label: "Vendas" }
        ]}
      >
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
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Vendas" }
      ]}
      headerActions={headerActions}
    >
      {/* Grid Faturamento Mensal */}
      <FaturamentoMensalGrid 
        onMonthClick={handleMonthClick}
        selectedMonth={selectedMonth}
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-700/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Vendas</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalVendas}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-700/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Valor</p>
              <p className="text-base sm:text-xl font-bold text-white">{formatCurrency(stats.totalValor)}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
          <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-700/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-white/60">Portas</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalPortasEnrolar}</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Buscar cliente, telefone, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-blue-500/50"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white">
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
          <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="end">
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
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white/70 hover:bg-white/10">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10">
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
      <div className="p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10">
        <div className="rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                {visibleColumns.map(column => (
                  <TableHead 
                    key={column.id}
                    className={`text-white/60 cursor-pointer hover:bg-white/5 transition-colors select-none ${getColumnAlignment(column.id)} ${getColumnResponsiveClass(column.id)}`}
                    onClick={() => handleSort(column.id)}
                  >
                    <div className={`flex items-center gap-1 ${column.id === 'valor' || column.id === 'frete' || column.id === 'instalacao' || column.id === 'desconto' || column.id === 'acrescimo' ? 'justify-end' : column.id === 'faturada' ? 'justify-center' : ''}`}>
                      {column.label}
                      {sortConfig.column === column.id ? (
                        sortConfig.direction === 'asc' 
                          ? <ArrowUp className="h-3 w-3 text-blue-400" />
                          : <ArrowDown className="h-3 w-3 text-blue-400" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-white/40">
                    Nenhuma venda encontrada
                  </TableCell>
                </TableRow>
              ) : (
                sortedVendas.map((venda) => (
                  <TableRow 
                    key={venda.id} 
                    className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => navigate(`/direcao/vendas/${venda.id}`)}
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
      </div>
    </MinimalistLayout>
  );
}
