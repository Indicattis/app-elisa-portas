import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  CalendarIcon, 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Clock,
  Truck,
  Wrench,
  Paintbrush,
  Target,
  Calculator,
  Timer,
  AlertCircle,
  TrendingDown,
  Plus,
  Minus,
  Pencil,
  MessageSquare
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { calcularTempoExpediente } from "@/utils/calcularTempoExpediente";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBreadcrumb } from "@/components/AnimatedBreadcrumb";
import { FloatingProfileMenu } from "@/components/FloatingProfileMenu";
import { ColumnManager } from "@/components/ColumnManager";
import { useColumnConfig, ColumnConfig } from "@/hooks/useColumnConfig";
import { generateFaturamentoPDF } from "@/utils/faturamentoPDFGenerator";
import { VendasNaoFaturadasHistorico } from "@/components/faturamento/VendasNaoFaturadasHistorico";

interface Venda {
  id: string;
  data_venda: string;
  atendente_id: string;
  atendente_nome: string;
  atendente_foto?: string | null;
  publico_alvo: string | null;
  estado: string | null;
  cidade: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  valor_produto: number;
  custo_produto: number;
  valor_pintura: number;
  custo_pintura: number;
  valor_instalacao: number;
  valor_frete: number;
  valor_venda: number;
  valor_credito?: number;
  lucro_total: number;
  frete_aprovado?: boolean;
  metodo_pagamento?: string | null;
  portas?: any[];
  produtos?: any[];
  justificativa_nao_faturada?: string | null;
  data_pagamento_1?: string | null;
  data_pagamento_2?: string | null;
}

import { getFormaPagamentoLabel } from '@/utils/formatters';

const COLUNAS_DISPONIVEIS: ColumnConfig[] = [
  { id: 'data', label: 'Data', defaultVisible: true },
  { id: 'cliente', label: 'Cliente', defaultVisible: true },
  { id: 'atendente', label: 'Atendente', defaultVisible: true },
  { id: 'tipo_entrega', label: 'Tipo Entrega', defaultVisible: true },
  { id: 'pagamento', label: 'Pagamento', defaultVisible: true },
  { id: 'data_pgto_1', label: 'Data Pgto 1', defaultVisible: true },
  { id: 'data_pgto_2', label: 'Data Pgto 2', defaultVisible: true },
  { id: 'valor_frete', label: 'Frete', defaultVisible: true },
  { id: 'valor_instalacao', label: 'Instalação', defaultVisible: true },
  { id: 'desconto_acrescimo', label: 'Desc./Acrés.', defaultVisible: true },
  { id: 'tempo_faturamento', label: 'Tempo', defaultVisible: true },
  { id: 'justificativa', label: 'Justificativa', defaultVisible: true },
  { id: 'lucro_total', label: 'Lucro', defaultVisible: true },
  { id: 'valor_total', label: 'Valor Total', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function FaturamentoMinimalista() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'todas' | 'faturadas' | 'nao_faturadas'>('todas');
  const [selectedAtendente, setSelectedAtendente] = useState<string>("todos");
  const [atendentes, setAtendentes] = useState<any[]>([]);
  const [justificativaDialog, setJustificativaDialog] = useState<{ open: boolean; vendaId: string; vendaCliente: string; justificativa: string }>({ 
    open: false, 
    vendaId: '', 
    vendaCliente: '',
    justificativa: '' 
  });
  const [savingJustificativa, setSavingJustificativa] = useState(false);

  const {
    columns,
    visibleColumns,
    visibleIds,
    toggleColumn,
    setColumnOrder,
    resetColumns
  } = useColumnConfig('faturamento_minimalista_columns', COLUNAS_DISPONIVEIS);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchVendas();
    fetchAtendentes();
  }, [dateRange]);

  const fetchAtendentes = async () => {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id, nome')
      .order('nome');
    if (data) setAtendentes(data);
  };

  const fetchVendas = async () => {
    try {
      let query = supabase
        .from("vendas")
        .select(`
          id,
          data_venda,
          atendente_id,
          publico_alvo,
          estado,
          cidade,
          cliente_nome,
          valor_instalacao,
          valor_frete,
          valor_venda,
          valor_credito,
          lucro_total,
          custo_total,
          frete_aprovado,
          justificativa_nao_faturada,
          metodo_pagamento,
          produtos_vendas (
            id,
            tipo_produto,
            valor_produto,
            valor_pintura,
            quantidade,
            lucro_item,
            custo_produto,
            custo_pintura,
            faturamento,
            desconto_valor
          )
        `)
        .order("data_venda", { ascending: false });

      if (dateRange?.from && dateRange?.to) {
        const startDate = format(dateRange.from, "yyyy-MM-dd");
        const endDate = format(dateRange.to, "yyyy-MM-dd");
        query = query
          .gte("data_venda", startDate + " 00:00:00")
          .lte("data_venda", endDate + " 23:59:59");
      }

      const { data: vendasData, error } = await query;
      if (error) throw error;

      if (!vendasData || vendasData.length === 0) {
        setVendas([]);
        return;
      }

      const { data: todosUsuarios } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url");

      const atendenteMap = new Map();
      if (todosUsuarios) {
        todosUsuarios.forEach(user => {
          atendenteMap.set(user.user_id, { nome: user.nome, foto: user.foto_perfil_url });
        });
      }

      // Buscar datas de pagamento das contas_receber
      const vendaIds = vendasData.map((v: any) => v.id);
      const { data: contasData } = await supabase
        .from('contas_receber')
        .select('venda_id, metodo_pagamento, data_vencimento')
        .in('venda_id', vendaIds)
        .order('data_vencimento', { ascending: true });

      // Processar datas de pagamento por venda
      const pagamentosPorVenda = new Map<string, { data1?: string; data2?: string }>();
      if (contasData) {
        contasData.forEach((conta: any) => {
          const existing = pagamentosPorVenda.get(conta.venda_id) || {};
          if (!existing.data1) {
            existing.data1 = conta.data_vencimento;
            (existing as any).metodo1 = conta.metodo_pagamento;
          } else if (!existing.data2 && conta.metodo_pagamento !== (existing as any).metodo1) {
            existing.data2 = conta.data_vencimento;
          }
          pagamentosPorVenda.set(conta.venda_id, existing);
        });
      }

      const vendasCompletas = vendasData.map((venda: any) => {
        const atendenteData = venda.atendente_id ? atendenteMap.get(venda.atendente_id) : null;
        const portas = venda.produtos_vendas || [];
        const pagamentos = pagamentosPorVenda.get(venda.id);
        
        const valor_produto = portas.reduce((acc: number, p: any) => 
          acc + (p.valor_produto || 0) * (p.quantidade || 1), 0);
        const valor_pintura = portas.reduce((acc: number, p: any) => 
          acc + (p.valor_pintura || 0) * (p.quantidade || 1), 0);
        
        const portasFaturadas = portas.filter((p: any) => (p.lucro_item || 0) > 0);
        const custo_produto = portasFaturadas.reduce((acc: number, p: any) => 
          acc + ((p.custo_produto || 0) * (p.quantidade || 1)), 0);
        const custo_pintura = portasFaturadas.reduce((acc: number, p: any) => 
          acc + ((p.custo_pintura || 0) * (p.quantidade || 1)), 0);
        
        return {
          ...venda,
          atendente_nome: atendenteData?.nome || "Atendente não encontrado",
          atendente_foto: atendenteData?.foto || null,
          portas,
          valor_produto,
          valor_pintura,
          custo_produto,
          custo_pintura,
          data_pagamento_1: pagamentos?.data1 || null,
          data_pagamento_2: pagamentos?.data2 || null,
        };
      });

      setVendas(vendasCompletas);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFaturada = (venda: Venda) => {
    const portas = venda.portas || [];
    if (portas.length === 0) return false;
    const freteAprovado = (venda as any).frete_aprovado === true;
    const temCustoTotal = ((venda as any).custo_total || 0) > 0;
    if (!freteAprovado || !temCustoTotal) return false;
    return portas.every((p: any) => p.faturamento === true);
  };

  const calcularLucroTotal = (venda: Venda) => {
    const portas = venda.portas || [];
    return portas.reduce((acc: number, p: any) => acc + (p.lucro_item || 0), 0);
  };

  const filteredVendas = vendas.filter(venda => {
    if (activeTab === 'faturadas' && !isFaturada(venda)) return false;
    if (activeTab === 'nao_faturadas' && isFaturada(venda)) return false;
    if (selectedAtendente !== "todos" && venda.atendente_id !== selectedAtendente) return false;
    
    const matchesSearch = 
      (venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venda.cidade?.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const vendasFaturadas = vendas.filter(isFaturada);
  const vendasPendentes = vendas.filter(v => !isFaturada(v));
  
  const faturamentoTotal = filteredVendas.reduce((acc, v) => 
    acc + ((v.valor_venda || 0) + (v.valor_credito || 0) - (v.valor_frete || 0)), 0);
  
  const vendasParaLucros = filteredVendas.filter(isFaturada);
  
  const lucroBrutoTotal = vendasParaLucros.reduce((acc, v) => {
    const portas = v.portas || [];
    const lucroItens = portas.reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
    return acc + lucroItens + (v.valor_instalacao || 0);
  }, 0);

  // Indicadores do período (mesmo formato da Direção)
  const indicadores = {
    faturamentoTotal: filteredVendas.reduce((acc, v) => 
      acc + (v.valor_venda || 0) + (v.valor_credito || 0) - (v.valor_frete || 0), 0),
    
    quantidadePortas: filteredVendas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas.filter((p: any) => 
        ['porta', 'porta_enrolar'].includes(p.tipo_produto)
      ).reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
    }, 0),
    
    // Valores brutos (vendas)
    valorBrutoPortas: filteredVendas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas
        .filter((p: any) => ['porta', 'porta_enrolar'].includes(p.tipo_produto))
        .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
    }, 0),
    
    valorBrutoPintura: filteredVendas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas
        .filter((p: any) => p.tipo_produto === 'pintura_epoxi')
        .reduce((sum: number, p: any) => sum + (p.valor_pintura || 0), 0);
    }, 0),
    
    valorBrutoInstalacoes: filteredVendas.reduce((acc, v) => 
      acc + (v.valor_instalacao || 0), 0),
    
    // Lucros
    lucroPortas: vendasParaLucros.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas
        .filter((p: any) => ['porta', 'porta_enrolar'].includes(p.tipo_produto))
        .reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
    }, 0),
    
    lucroPintura: vendasParaLucros.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas
        .filter((p: any) => p.tipo_produto === 'pintura_epoxi')
        .reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
    }, 0),
    
    lucroInstalacoes: vendasParaLucros.reduce((acc, v) => 
      acc + (v.valor_instalacao || 0), 0),
    
    fretesTotais: filteredVendas.reduce((acc, v) => 
      acc + (v.valor_frete || 0), 0),
    
    lucroLiquidoTotal: vendasParaLucros.reduce((acc, v) => {
      const portas = v.portas || [];
      const lucroItens = portas.reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
      return acc + lucroItens + (v.valor_instalacao || 0);
    }, 0),
    
    lucroBrutoTotal,
  };

  // Função para calcular tempo de faturamento (apenas horário comercial 7h-17h, seg-sex)
  const calcularTempoFaturamento = (venda: Venda) => {
    const dataVenda = new Date(venda.data_venda);
    const segundosExpediente = calcularTempoExpediente(dataVenda, new Date());
    const horasTotais = Math.floor(segundosExpediente / 3600);
    const dias = Math.floor(horasTotais / 10);
    const horas = horasTotais % 10;

    if (dias === 0) return `${horas}h`;
    if (dias === 1) return horas > 0 ? `1d ${horas}h` : `1 dia`;
    return horas > 0 ? `${dias}d ${horas}h` : `${dias} dias`;
  };

  const handleGeneratePDF = () => {
    if (filteredVendas.length > 1000) {
      toast({
        variant: "destructive",
        title: "Muitos registros",
        description: "O PDF suporta no máximo 1000 registros.",
      });
      return;
    }

    const stats = {
      faturamentoTotal,
      custosProducao: vendasParaLucros.reduce((acc, v) => acc + (v.custo_produto || 0), 0),
      custosPintura: vendasParaLucros.reduce((acc, v) => acc + (v.custo_pintura || 0), 0),
      instalacoesTotais: filteredVendas.reduce((acc, v) => acc + (v.valor_instalacao || 0), 0),
      fretesTotais: filteredVendas.reduce((acc, v) => acc + (v.valor_frete || 0), 0),
      quantidadePortas: indicadores.quantidadePortas,
      lucroPintura: indicadores.lucroPintura,
      lucroPortas: indicadores.lucroPortas,
      lucroBrutoTotal,
    };

    const periodo = dateRange?.from && dateRange?.to 
      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
      : undefined;

    generateFaturamentoPDF({
      vendas: filteredVendas,
      stats,
      filtros: { tab: activeTab, periodo }
    });
    
    toast({
      title: "PDF gerado com sucesso!",
      description: "O arquivo foi baixado automaticamente.",
    });
  };

  const handleOpenJustificativaDialog = (venda: Venda, e: React.MouseEvent) => {
    e.stopPropagation();
    setJustificativaDialog({
      open: true,
      vendaId: venda.id,
      vendaCliente: venda.cliente_nome || 'Cliente não informado',
      justificativa: venda.justificativa_nao_faturada || ''
    });
  };

  const handleSaveJustificativa = async () => {
    setSavingJustificativa(true);
    try {
      const { error } = await supabase
        .from('vendas')
        .update({ justificativa_nao_faturada: justificativaDialog.justificativa.trim() || null })
        .eq('id', justificativaDialog.vendaId);

      if (error) throw error;

      setVendas(prev => prev.map(v => 
        v.id === justificativaDialog.vendaId 
          ? { ...v, justificativa_nao_faturada: justificativaDialog.justificativa.trim() || null }
          : v
      ));

      toast({
        title: "Justificativa salva",
        description: "A justificativa foi atualizada com sucesso.",
      });
      setJustificativaDialog({ open: false, vendaId: '', vendaCliente: '', justificativa: '' });
    } catch (error) {
      console.error('Erro ao salvar justificativa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar a justificativa.",
      });
    } finally {
      setSavingJustificativa(false);
    }
  };

  const renderCell = (venda: Venda, columnId: string) => {
    switch(columnId) {
      case 'data':
        return (
          <span className="text-white/80">
            {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        );
      case 'cliente':
        return (
          <span className="text-white font-medium">
            {venda.cliente_nome || "Não informado"}
          </span>
        );
      case 'atendente':
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={venda.atendente_foto || undefined} />
              <AvatarFallback className="text-xs bg-white/20 text-white">
                {venda.atendente_nome.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white/80 text-sm">{venda.atendente_nome}</span>
          </div>
        );
      case 'tipo_entrega':
        return (venda.valor_instalacao || 0) > 0 ? (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Wrench className="h-4 w-4" />
            <span className="text-xs">Instalação</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-blue-400">
            <Truck className="h-4 w-4" />
            <span className="text-xs">Entrega</span>
          </div>
        );
      case 'pagamento':
        return (
          <span className="text-white/80 text-sm">
            {getFormaPagamentoLabel(venda.metodo_pagamento)}
          </span>
        );
      case 'data_pgto_1':
        return venda.data_pagamento_1 
          ? <span className="text-white/80">{format(new Date(venda.data_pagamento_1), 'dd/MM/yy')}</span>
          : <span className="text-white/30">-</span>;
      case 'data_pgto_2':
        return venda.data_pagamento_2 
          ? <span className="text-white/80">{format(new Date(venda.data_pagamento_2), 'dd/MM/yy')}</span>
          : <span className="text-white/30">-</span>;
      case 'valor_frete':
        return (
          <span className="text-white/80">
            {formatCurrency(venda.valor_frete || 0)}
          </span>
        );
      case 'valor_instalacao':
        return (
          <span className="text-white/80">
            {formatCurrency(venda.valor_instalacao || 0)}
          </span>
        );
      case 'desconto_acrescimo':
        const totalDesconto = (venda.portas || []).reduce((acc: number, p: any) => 
          acc + (p.desconto_valor || 0), 0);
        const acrescimo = venda.valor_credito || 0;
        
        if (totalDesconto > 0 && acrescimo > 0) {
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <div className="flex items-center gap-1 text-red-400">
                <Minus className="h-3 w-3" />
                {formatCurrency(totalDesconto)}
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <Plus className="h-3 w-3" />
                {formatCurrency(acrescimo)}
              </div>
            </div>
          );
        } else if (totalDesconto > 0) {
          return (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <Minus className="h-3.5 w-3.5" />
              {formatCurrency(totalDesconto)}
            </div>
          );
        } else if (acrescimo > 0) {
          return (
            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <Plus className="h-3.5 w-3.5" />
              {formatCurrency(acrescimo)}
            </div>
          );
        } else {
          return <span className="text-white/30">-</span>;
        }
      case 'tempo_faturamento':
        const tempo = calcularTempoFaturamento(venda);
        const faturada = isFaturada(venda);
        return (
          <div className={cn(
            "flex items-center gap-1.5 text-sm",
            faturada ? "text-emerald-400" : "text-amber-400"
          )}>
            <Timer className="h-3.5 w-3.5" />
            <span>{tempo}</span>
            {!faturada && <span className="animate-pulse">•</span>}
          </div>
        );
      case 'lucro_total':
        return isFaturada(venda) ? (
          <span className="text-emerald-400 font-medium">
            {formatCurrency(calcularLucroTotal(venda))}
          </span>
        ) : (
          <span className="text-white/30">-</span>
        );
      case 'valor_total':
        return (
          <span className="text-white font-semibold">
            {formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}
          </span>
        );
      case 'justificativa':
        if (isFaturada(venda)) {
          return <span className="text-white/30">-</span>;
        }
        return venda.justificativa_nao_faturada ? (
          <div className="flex items-center gap-1.5 max-w-[180px]">
            <span 
              className="text-white/70 text-xs truncate" 
              title={venda.justificativa_nao_faturada}
            >
              {venda.justificativa_nao_faturada}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 shrink-0 hover:bg-white/10"
              onClick={(e) => handleOpenJustificativaDialog(venda, e)}
            >
              <Pencil className="h-3 w-3 text-white/40" />
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            onClick={(e) => handleOpenJustificativaDialog(venda, e)}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Informar
          </Button>
        );
      case 'status':
        return isFaturada(venda) ? (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Faturada
          </Badge>
        ) : (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black p-6 space-y-6">
        <Skeleton className="h-12 w-64 bg-white/10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-white/10" />
          <Skeleton className="h-24 bg-white/10" />
          <Skeleton className="h-24 bg-white/10" />
        </div>
        <Skeleton className="h-96 bg-white/10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Breadcrumb */}
      <AnimatedBreadcrumb 
        items={[
          { label: "Home", path: "/home" },
          { label: "Administrativo", path: "/administrativo" },
          { label: "Financeiro", path: "/administrativo/financeiro" },
          { label: "Faturamento", path: "/administrativo/financeiro/faturamento" },
          { label: "Por Venda" }
        ]} 
        mounted={mounted} 
      />

      {/* Menu de Perfil Flutuante */}
      <FloatingProfileMenu mounted={mounted} />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/administrativo/financeiro/faturamento')}
        className="fixed top-4 left-4 z-50 p-1.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10
                   hover:bg-white/10 transition-all duration-300"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms'
        }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-700 text-white shadow-lg shadow-green-500/20">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </button>

      <div className="container mx-auto p-6 pt-20 space-y-6 max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Faturamento por Venda</h1>
            <p className="text-white/60">Controle de faturamento individual por venda</p>
          </div>
          <div className="flex gap-2">
            <ColumnManager
              columns={columns}
              visibleIds={visibleIds}
              onToggle={toggleColumn}
              onReorder={setColumnOrder}
              onReset={resetColumns}
            />
            <Button 
              onClick={handleGeneratePDF}
              className="bg-white/10 hover:bg-white/20 border border-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Faturamento Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(faturamentoTotal)}</div>
              <p className="text-xs text-white/50">{filteredVendas.length} vendas no período</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Lucro Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCurrency(lucroBrutoTotal)}</div>
              <p className="text-xs text-white/50">{vendasFaturadas.length} vendas faturadas</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Taxa de Conversão</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {vendas.length > 0 
                  ? `${((vendasFaturadas.length / vendas.length) * 100).toFixed(1)}%`
                  : '0%'}
              </div>
              <p className="text-xs text-white/50">vendas faturadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Indicadores do Período */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white/80 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-400" />
              Indicadores do Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-2">
                  <DollarSign className="h-3 w-3 text-blue-400" />
                  Portas
                </div>
                <p className="text-blue-400 font-bold text-lg">
                  {formatCurrency(indicadores.valorBrutoPortas)}
                </p>
                <p className="text-emerald-400 text-sm mt-1">
                  Lucro: {formatCurrency(indicadores.lucroPortas)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-2">
                  <Paintbrush className="h-3 w-3 text-orange-400" />
                  Pintura
                </div>
                <p className="text-orange-400 font-bold text-lg">
                  {formatCurrency(indicadores.valorBrutoPintura)}
                </p>
                <p className="text-emerald-400 text-sm mt-1">
                  Lucro: {formatCurrency(indicadores.lucroPintura)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-2">
                  <Wrench className="h-3 w-3 text-cyan-400" />
                  Instalações
                </div>
                <p className="text-cyan-400 font-bold text-lg">
                  {formatCurrency(indicadores.valorBrutoInstalacoes)}
                </p>
                <p className="text-emerald-400 text-sm mt-1">
                  Lucro: {formatCurrency(indicadores.lucroInstalacoes)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-2">
                  <Truck className="h-3 w-3 text-amber-400" />
                  Fretes
                </div>
                <p className="text-amber-400 font-bold text-lg">
                  {formatCurrency(indicadores.fretesTotais)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-2">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  Lucro Líquido
                </div>
                <p className="text-green-400 font-bold text-lg">
                  {formatCurrency(indicadores.lucroLiquidoTotal)}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-center gap-1 text-white/50 text-xs mb-2">
                  <Target className="h-3 w-3 text-purple-400" />
                  Qtd Portas
                </div>
                <p className="text-purple-400 font-bold text-lg">
                  {indicadores.quantidadePortas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  placeholder="Buscar por cliente, atendente ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              
              <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
                <SelectTrigger className="w-[200px] bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Atendente" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="todos" className="text-white">Todos atendentes</SelectItem>
                  {atendentes.map((at) => (
                    <SelectItem key={at.user_id} value={at.user_id} className="text-white">{at.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "w-[280px] justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10",
                      !dateRange && "text-white/50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                      )
                    ) : (
                      <span>Selecione o período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Botões de Filtro Centralizados */}
            <div className="flex justify-center gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('todas')}
                className={cn(
                  "rounded-full px-5 py-2 transition-all",
                  activeTab === 'todas' 
                    ? "bg-white/20 text-white" 
                    : "text-white/50 hover:text-white hover:bg-white/10"
                )}
              >
                Todas ({vendas.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('faturadas')}
                className={cn(
                  "rounded-full px-5 py-2 transition-all",
                  activeTab === 'faturadas' 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "text-white/50 hover:text-emerald-400 hover:bg-emerald-500/10"
                )}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Faturadas ({vendasFaturadas.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('nao_faturadas')}
                className={cn(
                  "rounded-full px-5 py-2 transition-all",
                  activeTab === 'nao_faturadas' 
                    ? "bg-amber-500/20 text-amber-400" 
                    : "text-white/50 hover:text-amber-400 hover:bg-amber-500/10"
                )}
              >
                <Clock className="h-4 w-4 mr-1.5" />
                Pendentes ({vendasPendentes.length})
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border border-white/10 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    {visibleColumns.map(column => (
                      <TableHead 
                        key={column.id} 
                        className={cn(
                          "text-white/70",
                          ['valor_frete', 'valor_instalacao', 'lucro_total', 'valor_total'].includes(column.id) && "text-right",
                          column.id === 'status' && "text-center"
                        )}
                      >
                        {column.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length} className="text-center text-white/50 py-8">
                        Nenhuma venda encontrada no período
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendas.map((venda) => (
                      <TableRow 
                        key={venda.id} 
                        className="border-white/10 hover:bg-white/5 cursor-pointer"
                        onClick={() => navigate(`/administrativo/financeiro/faturamento/${venda.id}?from=vendas`)}
                      >
                        {visibleColumns.map(column => (
                          <TableCell 
                            key={column.id}
                            className={cn(
                              ['valor_frete', 'valor_instalacao', 'lucro_total', 'valor_total'].includes(column.id) && "text-right",
                              column.id === 'status' && "text-center"
                            )}
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
          </CardContent>
        </Card>

        {/* Vendas Não Faturadas - Histórico 3 meses */}
        <VendasNaoFaturadasHistorico 
          onOpenJustificativa={(vendaId, clienteNome, justificativa) => {
            setJustificativaDialog({
              open: true,
              vendaId,
              vendaCliente: clienteNome,
              justificativa
            });
          }}
        />
      </div>

      {/* Dialog de Justificativa */}
      <Dialog 
        open={justificativaDialog.open} 
        onOpenChange={(open) => !savingJustificativa && setJustificativaDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Justificativa de Não Faturamento
            </DialogTitle>
            <p className="text-sm text-white/60">
              Cliente: {justificativaDialog.vendaCliente}
            </p>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Informe o motivo da venda ainda não estar faturada..."
              value={justificativaDialog.justificativa}
              onChange={(e) => setJustificativaDialog(prev => ({ ...prev, justificativa: e.target.value }))}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-[120px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setJustificativaDialog({ open: false, vendaId: '', vendaCliente: '', justificativa: '' })}
              disabled={savingJustificativa}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveJustificativa}
              disabled={savingJustificativa}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {savingJustificativa ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
