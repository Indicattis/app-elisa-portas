import { useEffect, useState, useMemo, useCallback } from "react";
import { IndicadorExpandivel } from "@/components/direcao/IndicadorExpandivel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Search, DollarSign, CalendarIcon, CheckCircle2, Clock, ArrowUpDown, ArrowUp, ArrowDown, Check, X, Truck, Hammer, TrendingUp, Target, Paintbrush, Wrench, AlertCircle, Calculator, Info, Package, PlusCircle, Filter, PanelRight, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { useColumnConfig, ColumnConfig } from "@/hooks/useColumnConfig";
import { ColumnManager } from "@/components/ColumnManager";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AutorizacaoDesconto {
  id: string;
  percentual_desconto: number;
  tipo_autorizacao: string;
  autorizado_por: string;
  autorizador?: {
    nome: string;
    foto_perfil_url?: string | null;
  } | null;
}

interface Venda {
  id: string;
  data_venda: string;
  atendente_id: string;
  atendente_nome: string;
  atendente_foto?: string | null;
  cliente_nome: string | null;
  cidade: string | null;
  estado: string | null;
  valor_venda: number;
  valor_credito?: number;
  valor_frete: number;
  valor_instalacao?: number;
  lucro_instalacao?: number;
  instalacao_faturada?: boolean;
  data_prevista_entrega?: string | null;
  tipo_entrega?: string | null;
  frete_aprovado?: boolean;
  portas?: any[];
  justificativa_nao_faturada?: string | null;
  autorizacao_desconto?: AutorizacaoDesconto[];
  data_pagamento_1?: string | null;
  data_pagamento_2?: string | null;
  valor_a_receber?: number | null;
  valor_a_receber_faturamento?: boolean;
}

// Definição das colunas disponíveis
const COLUNAS_DISPONIVEIS: ColumnConfig[] = [
  { id: 'vendedor', label: '-', defaultVisible: true },
  { id: 'cliente', label: 'Cliente', defaultVisible: true },
  { id: 'data', label: 'Data', defaultVisible: true },
  { id: 'cidade', label: 'Cidade', defaultVisible: true },
  { id: 'expedicao', label: 'Expedição', defaultVisible: true },
  { id: 'desconto_acrescimo', label: 'Desc./Acrés.', defaultVisible: true },
  { id: 'valor', label: 'Valor', defaultVisible: true },
  { id: 'lucro', label: 'Lucro', defaultVisible: true },
  { id: 'tempo_sem_faturar', label: 'Tempo s/ Faturar', defaultVisible: true },
  { id: 'justificativa', label: 'Justificativa', defaultVisible: true },
  { id: 'faturada', label: 'Faturada', defaultVisible: true },
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

export default function FaturamentoDirecao() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
  const [leftSheetOpen, setLeftSheetOpen] = useState(false);
  const [rightSheetOpen, setRightSheetOpen] = useState(false);
  const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
  const [mobileDownbarOpen, setMobileDownbarOpen] = useState(false);
  const [indicadorDrawerOpen, setIndicadorDrawerOpen] = useState(false);
  const [indicadorAtivo, setIndicadorAtivo] = useState<string | null>(null);
  const [auxCores, setAuxCores] = useState<Map<string, { nome: string; hex: string }>>(new Map());
  const [auxAcessorios, setAuxAcessorios] = useState<Map<string, string>>(new Map());
  const [auxAdicionais, setAuxAdicionais] = useState<Map<string, string>>(new Map());
  const isMobile = useIsMobile();
  const [selectedAtendente, setSelectedAtendente] = useState<string>("todos");
  const [atendentes, setAtendentes] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    column: string | null;
    direction: 'asc' | 'desc' | null;
  }>({ column: null, direction: null });
  const navigate = useNavigate();
  

  const {
    columns,
    visibleColumns,
    visibleIds,
    toggleColumn,
    setColumnOrder,
    resetColumns
  } = useColumnConfig('direcao_faturamento_columns', COLUNAS_DISPONIVEIS);

  const isFaturada = (venda: Venda) => {
    const portas = venda.portas || [];
    if (portas.length === 0) return false;
    const freteAprovado = venda.frete_aprovado === true;
    const todosProdutosFaturados = portas.every((p: any) => p.faturamento === true);
    return freteAprovado && todosProdutosFaturados;
  };

  useEffect(() => {
    fetchVendas();
    fetchAtendentes();
    fetchAuxData();
  }, [dateRange]);

  const fetchAuxData = async () => {
    const [{ data: cores }, { data: acessorios }, { data: adicionais }] = await Promise.all([
      supabase.from('catalogo_cores').select('id, nome, codigo_hex'),
      supabase.from('acessorios').select('id, nome'),
      supabase.from('adicionais').select('id, nome'),
    ]);
    if (cores) setAuxCores(new Map(cores.map(c => [c.id, { nome: c.nome, hex: c.codigo_hex }])));
    if (acessorios) setAuxAcessorios(new Map(acessorios.map(a => [a.id, a.nome])));
    if (adicionais) setAuxAdicionais(new Map(adicionais.map(a => [a.id, a.nome])));
  };

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
          estado,
          cidade,
          cliente_nome,
          valor_venda,
          valor_credito,
          valor_frete,
          valor_instalacao,
          lucro_instalacao,
          instalacao_faturada,
          data_prevista_entrega,
          tipo_entrega,
          frete_aprovado,
          justificativa_nao_faturada,
          valor_a_receber,
          valor_a_receber_faturamento,
          produtos_vendas (
            id,
            tipo_produto,
            descricao,
            valor_produto,
            valor_pintura,
            quantidade,
            faturamento,
            desconto_valor,
            custo_produto,
            custo_pintura,
            lucro_item,
            tamanho,
            cor_id,
            acessorio_id,
            adicional_id
          ),
          autorizacao_desconto:vendas_autorizacoes_desconto(
            id,
            percentual_desconto,
            tipo_autorizacao,
            autorizado_por,
            autorizador:admin_users!vendas_autorizacoes_desconto_autorizado_por_fkey(
              nome,
              foto_perfil_url
            )
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
        const pagamentos = pagamentosPorVenda.get(venda.id);
        return {
          ...venda,
          atendente_nome: atendenteData?.nome || "Não encontrado",
          atendente_foto: atendenteData?.foto || null,
          portas: venda.produtos_vendas || [],
          autorizacao_desconto: venda.autorizacao_desconto || [],
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

  const filteredVendas = useMemo(() => {
    return vendas.filter(venda => {
      // Status filter
      if (filtroStatus.length > 0) {
        const faturada = isFaturada(venda);
        const matchStatus = filtroStatus.some(s => {
          if (s === 'faturadas') return faturada;
          if (s === 'nao_faturadas') return !faturada;
          return false;
        });
        if (!matchStatus) return false;
      }

      if (selectedAtendente !== "todos" && venda.atendente_id !== selectedAtendente) {
        return false;
      }

      const matchesSearch = 
        (venda.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (venda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (venda.cidade?.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [vendas, filtroStatus, selectedAtendente, searchTerm]);

  // Ordenação das vendas
  const sortedVendas = useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) {
      return filteredVendas;
    }

    return [...filteredVendas].sort((a, b) => {
      const getValue = (venda: Venda) => {
        switch (sortConfig.column) {
          case 'data':
            return new Date(venda.data_venda).getTime();
          case 'cliente':
            return venda.cliente_nome?.toLowerCase() || '';
          case 'vendedor':
            return venda.atendente_nome.toLowerCase();
          case 'cidade':
            return venda.cidade?.toLowerCase() || '';
          case 'previsao':
            return venda.data_prevista_entrega ? new Date(venda.data_prevista_entrega).getTime() : 0;
          case 'expedicao':
            return venda.tipo_entrega || '';
          case 'desconto_acrescimo':
            const desc = (venda.portas || []).reduce((sum: number, p: any) => sum + (p.desconto_valor || 0), 0);
            const acre = venda.valor_credito || 0;
            return acre - desc;
          case 'instalacao':
            return venda.valor_instalacao || 0;
          case 'frete':
            return venda.valor_frete || 0;
          case 'valor_porta':
            return (venda.portas || [])
              .filter((p: any) => ['porta', 'porta_enrolar'].includes(p.tipo_produto))
              .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
          case 'valor_pintura':
            return (venda.portas || [])
              .filter((p: any) => p.tipo_produto === 'pintura_epoxi')
              .reduce((sum: number, p: any) => sum + (p.valor_pintura || 0), 0);
          case 'valor':
            return (venda.valor_venda || 0) + (venda.valor_credito || 0);
          case 'tempo_sem_faturar':
            if (isFaturada(venda)) return -1;
            return differenceInDays(new Date(), new Date(venda.data_venda));
          case 'lucro':
            return calcularLucroVenda(venda);
          case 'justificativa':
            return venda.justificativa_nao_faturada || '';
          case 'faturada':
            return isFaturada(venda) ? 1 : 0;
          default:
            return 0;
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [filteredVendas, sortConfig]);

  const handleSort = useCallback((columnId: string) => {
    setSortConfig(prev => {
      if (prev.column !== columnId) {
        return { column: columnId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: columnId, direction: 'desc' };
      }
      return { column: null, direction: null };
    });
  }, []);

  const calcularLucroVenda = (venda: Venda) => {
    const portas = venda.portas || [];
    const lucroProdutos = portas.reduce((acc: number, p: any) => acc + (p.lucro_item || 0), 0);
    const lucroInstalacao = venda.lucro_instalacao || 0;
    return lucroProdutos + lucroInstalacao;
  };

  const stats = useMemo(() => {
    const faturadas = filteredVendas.filter(isFaturada);
    const naoFaturadas = filteredVendas.filter(v => !isFaturada(v));
    
    return {
      faturamento: filteredVendas.reduce((acc, v) => 
        acc + ((v.valor_venda || 0) + (v.valor_credito || 0) - (v.valor_frete || 0)), 0),
      faturadas: faturadas.length,
      naoFaturadas: naoFaturadas.length,
    };
  }, [filteredVendas]);

  // Indicadores do período (mesmo do FaturamentoVendasMinimalista)
  const indicadores = useMemo(() => {
    const vendasFaturadas = filteredVendas.filter(isFaturada);
    
    // Valores brutos (vendas)
    const valorBrutoPortas = filteredVendas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas
        .filter((p: any) => ['porta', 'porta_enrolar', 'porta_social'].includes(p.tipo_produto))
        .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
    }, 0);
    
    const valorBrutoPintura = filteredVendas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas
        .filter((p: any) => p.tipo_produto === 'pintura_epoxi')
        .reduce((sum: number, p: any) => sum + (p.valor_pintura || 0), 0);
    }, 0);
    
    const valorBrutoInstalacoes = filteredVendas.reduce((acc, v) => 
      acc + (v.valor_instalacao || 0), 0);

    const valorBrutoAcessorios = filteredVendas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas
        .filter((p: any) => p.tipo_produto === 'acessorio')
        .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
    }, 0);

    const valorBrutoAdicionais = filteredVendas.reduce((acc, v) => {
      const portas = v.portas || [];
      return acc + portas
        .filter((p: any) => ['adicional', 'manutencao'].includes(p.tipo_produto))
        .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
    }, 0);
    
    return {
      faturamentoTotal: filteredVendas.reduce((acc, v) => 
        acc + (v.valor_venda || 0) + (v.valor_credito || 0) - (v.valor_frete || 0), 0),
      
      quantidadePortas: filteredVendas.reduce((acc, v) => {
        const portas = v.portas || [];
        return acc + portas.filter((p: any) => 
          ['porta', 'porta_enrolar', 'porta_social'].includes(p.tipo_produto)
        ).reduce((sum: number, p: any) => sum + (p.quantidade || 1), 0);
      }, 0),
      
      valorBrutoPortas,
      lucroPortas: vendasFaturadas.reduce((acc, v) => {
        const portas = v.portas || [];
        return acc + portas
          .filter((p: any) => ['porta', 'porta_enrolar', 'porta_social'].includes(p.tipo_produto))
          .reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
      }, 0),
      
      valorBrutoPintura,
      lucroPintura: vendasFaturadas.reduce((acc, v) => {
        const portas = v.portas || [];
        return acc + portas
          .filter((p: any) => p.tipo_produto === 'pintura_epoxi')
          .reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
      }, 0),
      
      valorBrutoInstalacoes,
      lucroInstalacoes: vendasFaturadas.reduce((acc, v) => 
        acc + (v.lucro_instalacao || 0), 0),

      valorBrutoAcessorios,
      lucroAcessorios: vendasFaturadas.reduce((acc, v) => {
        const portas = v.portas || [];
        return acc + portas
          .filter((p: any) => p.tipo_produto === 'acessorio')
          .reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
      }, 0),

      valorBrutoAdicionais,
      lucroAdicionais: vendasFaturadas.reduce((acc, v) => {
        const portas = v.portas || [];
        return acc + portas
          .filter((p: any) => ['adicional', 'manutencao'].includes(p.tipo_produto))
          .reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
      }, 0),
      
      fretesTotais: filteredVendas.reduce((acc, v) => 
        acc + (v.valor_frete || 0), 0),
      
      lucroLiquidoTotal: vendasFaturadas.reduce((acc, v) => {
        const portas = v.portas || [];
        const lucroItens = portas.reduce((sum: number, p: any) => sum + (p.lucro_item || 0), 0);
        const lucroInstalacao = v.lucro_instalacao || 0;
        return acc + lucroItens + lucroInstalacao;
      }, 0),
    };
  }, [filteredVendas]);

  // Ranking data for indicator drawer
  const rankingData = useMemo(() => {
    if (!indicadorAtivo) return [];
    const map = new Map<string, { nome: string; quantidade: number; valor_total: number; cor_hex?: string }>();

    if (indicadorAtivo === 'portas') {
      filteredVendas.forEach(v => {
        (v.portas || []).filter((p: any) => ['porta', 'porta_enrolar', 'porta_social'].includes(p.tipo_produto)).forEach((p: any) => {
          const key = p.tamanho || 'Sem tamanho';
          const cur = map.get(key) || { nome: key, quantidade: 0, valor_total: 0 };
          cur.quantidade += p.quantidade || 1;
          cur.valor_total += p.valor_produto || 0;
          map.set(key, cur);
        });
      });
    } else if (indicadorAtivo === 'pintura') {
      filteredVendas.forEach(v => {
        (v.portas || []).filter((p: any) => p.tipo_produto === 'pintura_epoxi').forEach((p: any) => {
          const corInfo = p.cor_id ? auxCores.get(p.cor_id) : null;
          const key = p.cor_id || 'sem_cor';
          const nome = corInfo?.nome || 'Cor não especificada';
          const cur = map.get(key) || { nome, quantidade: 0, valor_total: 0, cor_hex: corInfo?.hex };
          cur.quantidade += p.quantidade || 1;
          cur.valor_total += p.valor_pintura || 0;
          map.set(key, cur);
        });
      });
    } else if (indicadorAtivo === 'instalacoes') {
      filteredVendas.filter(v => (v.valor_instalacao || 0) > 0).forEach(v => {
        const key = v.cidade || 'Sem cidade';
        const cur = map.get(key) || { nome: key, quantidade: 0, valor_total: 0 };
        cur.quantidade += 1;
        cur.valor_total += v.valor_instalacao || 0;
        map.set(key, cur);
      });
    } else if (indicadorAtivo === 'acessorios') {
      filteredVendas.forEach(v => {
        (v.portas || []).filter((p: any) => p.tipo_produto === 'acessorio').forEach((p: any) => {
          const key = p.acessorio_id || p.descricao || 'sem_id';
          const nome = p.acessorio_id ? (auxAcessorios.get(p.acessorio_id) || p.descricao || 'Acessório') : (p.descricao || 'Acessório');
          const cur = map.get(key) || { nome, quantidade: 0, valor_total: 0 };
          cur.quantidade += p.quantidade || 1;
          cur.valor_total += p.valor_produto || 0;
          map.set(key, cur);
        });
      });
    } else if (indicadorAtivo === 'adicionais') {
      filteredVendas.forEach(v => {
        (v.portas || []).filter((p: any) => ['adicional', 'manutencao'].includes(p.tipo_produto)).forEach((p: any) => {
          const key = p.adicional_id || p.descricao || 'sem_id';
          const nome = p.adicional_id ? (auxAdicionais.get(p.adicional_id) || p.descricao || 'Adicional') : (p.descricao || 'Adicional');
          const cur = map.get(key) || { nome, quantidade: 0, valor_total: 0 };
          cur.quantidade += p.quantidade || 1;
          cur.valor_total += p.valor_produto || 0;
          map.set(key, cur);
        });
      });
    }

    return Array.from(map.values()).sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredVendas, indicadorAtivo, auxCores, auxAcessorios, auxAdicionais]);

  const indicadorTitulos: Record<string, string> = {
    portas: 'Portas',
    pintura: 'Pintura',
    instalacoes: 'Instalações',
    acessorios: 'Acessórios',
    adicionais: 'Adicionais',
  };

  const indicadorIcons: Record<string, React.ReactNode> = {
    portas: <DollarSign className="h-4 w-4 text-blue-400" />,
    pintura: <Paintbrush className="h-4 w-4 text-orange-400" />,
    instalacoes: <Wrench className="h-4 w-4 text-cyan-400" />,
    acessorios: <Package className="h-4 w-4 text-pink-400" />,
    adicionais: <PlusCircle className="h-4 w-4 text-indigo-400" />,
  };


  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSortIcon = (columnId: string) => {
    if (sortConfig.column !== columnId) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1 text-blue-400" />;
    }
    return <ArrowDown className="h-3 w-3 ml-1 text-blue-400" />;
  };

  const getColumnResponsiveClass = (columnId: string) => {
    const hiddenOnMobile = ['cidade', 'previsao', 'expedicao', 'desconto_acrescimo', 'instalacao', 'frete', 'valor_porta', 'valor_pintura', 'tempo_sem_faturar', 'justificativa', 'lucro'];
    if (hiddenOnMobile.includes(columnId)) {
      return 'hidden md:table-cell';
    }
    return '';
  };

  const getColumnAlignment = (columnId: string) => {
    const rightAligned = ['valor', 'frete', 'instalacao', 'desconto_acrescimo', 'valor_porta', 'valor_pintura', 'lucro'];
    const centerAligned = ['faturada', 'expedicao', 'tempo_sem_faturar'];
    if (rightAligned.includes(columnId)) return 'text-right';
    if (centerAligned.includes(columnId)) return 'text-center';
    return 'text-left';
  };

  const renderCell = (venda: Venda, columnId: string) => {
    switch (columnId) {
      case 'vendedor':
        return (
          <Avatar className="h-6 w-6">
            <AvatarImage src={venda.atendente_foto || undefined} />
            <AvatarFallback className="text-[10px] bg-blue-500/20 text-blue-400">
              {venda.atendente_nome?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        );
      case 'cliente':
        return <span className="text-white font-medium">{venda.cliente_nome}</span>;
      case 'data':
        return <span className="text-white/80">{format(new Date(venda.data_venda), 'dd/MM/yy', { locale: ptBR })}</span>;
      case 'cidade':
        return <span className="text-white/60">{venda.cidade}{venda.estado ? `/${venda.estado}` : ''}</span>;
      case 'previsao':
        return venda.data_prevista_entrega 
          ? <span className="text-white/80">{format(new Date(venda.data_prevista_entrega), 'dd/MM/yy', { locale: ptBR })}</span>
          : <span className="text-white/30">-</span>;
      case 'expedicao':
        if (venda.tipo_entrega === 'instalacao') {
          return <Hammer className="h-4 w-4 text-orange-400 mx-auto" />;
        }
        if (venda.tipo_entrega === 'entrega') {
          return <Truck className="h-4 w-4 text-blue-400 mx-auto" />;
        }
        return <span className="text-white/30">-</span>;
      case 'desconto_acrescimo':
        const descontoTotal = (venda.portas || []).reduce((sum: number, p: any) => sum + (p.desconto_valor || 0), 0);
        const acrescimoTotal = venda.valor_credito || 0;
        const saldo = acrescimoTotal - descontoTotal;
        const autorizacao = venda.autorizacao_desconto?.[0];
        
        if (saldo === 0) {
          return <span className="text-white/30">-</span>;
        }
        
        // Se tem desconto (saldo negativo), mostrar tooltip
        if (descontoTotal > 0) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`cursor-help underline decoration-dotted underline-offset-2 ${saldo > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {saldo > 0 ? `+${formatCurrency(saldo)}` : formatCurrency(saldo)}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-zinc-700 p-3 max-w-xs">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-white flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-red-400" />
                    Detalhes do Desconto
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="text-white/70">
                      <span className="text-white/50">Desconto:</span> -{formatCurrency(descontoTotal)}
                    </p>
                    {acrescimoTotal > 0 && (
                      <p className="text-white/70">
                        <span className="text-white/50">Acréscimo:</span> +{formatCurrency(acrescimoTotal)}
                      </p>
                    )}
                    {autorizacao && (
                      <>
                        <p className="text-white/70">
                          <span className="text-white/50">Percentual:</span>{' '}
                          {autorizacao.percentual_desconto?.toFixed(2)}%
                        </p>
                        <p className="text-white/70">
                          <span className="text-white/50">Tipo:</span>{' '}
                          {autorizacao.tipo_autorizacao === 'master' 
                            ? 'Senha Master' 
                            : 'Responsável do Setor'}
                        </p>
                        <p className="text-white/70">
                          <span className="text-white/50">Autorizado por:</span>{' '}
                          {autorizacao.autorizador?.nome || 'Não informado'}
                        </p>
                      </>
                    )}
                    {!autorizacao && (
                      <p className="text-white/50 italic">
                        Desconto dentro do limite automático
                      </p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        }
        
        // Só tem acréscimo
        return <span className="text-green-400">+{formatCurrency(saldo)}</span>;
      case 'data_pgto_1':
        return venda.data_pagamento_1 
          ? <span className="text-white/80">{format(new Date(venda.data_pagamento_1), 'dd/MM/yy')}</span>
          : <span className="text-white/30">-</span>;
      case 'data_pgto_2':
        return venda.data_pagamento_2 
          ? <span className="text-white/80">{format(new Date(venda.data_pagamento_2), 'dd/MM/yy')}</span>
          : <span className="text-white/30">-</span>;
      case 'instalacao':
        return venda.valor_instalacao && venda.valor_instalacao > 0
          ? <span className="text-white/80">{formatCurrency(venda.valor_instalacao)}</span>
          : <span className="text-white/30">-</span>;
      case 'frete':
        return venda.valor_frete && venda.valor_frete > 0
          ? <span className="text-white/80">{formatCurrency(venda.valor_frete)}</span>
          : <span className="text-white/30">-</span>;
      case 'valor_porta':
        const valorPortas = (venda.portas || [])
          .filter((p: any) => ['porta', 'porta_enrolar'].includes(p.tipo_produto))
          .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
        return valorPortas > 0
          ? <span className="text-white/80">{formatCurrency(valorPortas)}</span>
          : <span className="text-white/30">-</span>;
      case 'valor_pintura':
        const valorPintura = (venda.portas || [])
          .filter((p: any) => p.tipo_produto === 'pintura_epoxi')
          .reduce((sum: number, p: any) => sum + (p.valor_pintura || 0), 0);
        return valorPintura > 0
          ? <span className="text-white/80">{formatCurrency(valorPintura)}</span>
          : <span className="text-white/30">-</span>;
      case 'valor':
        return <span className="text-white font-medium">{formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}</span>;
      case 'lucro':
        const lucroVenda = calcularLucroVenda(venda);
        return isFaturada(venda) 
          ? <span className="text-emerald-400 font-medium">{formatCurrency(lucroVenda)}</span>
          : <span className="text-white/30">-</span>;
      case 'tempo_sem_faturar':
        if (isFaturada(venda)) {
          return <span className="text-green-400/60 text-xs">Faturada</span>;
        }
        const dias = differenceInDays(new Date(), new Date(venda.data_venda));
        let colorClass = 'text-white/60';
        if (dias >= 30) colorClass = 'text-red-400';
        else if (dias >= 14) colorClass = 'text-amber-400';
        return <span className={`${colorClass} text-xs`}>{formatarTempoSemFaturar(dias)}</span>;
      case 'justificativa':
        if (isFaturada(venda)) {
          return <span className="text-white/30">-</span>;
        }
        return venda.justificativa_nao_faturada 
          ? (
            <span 
              className="text-white/70 text-xs truncate max-w-[180px] block" 
              title={venda.justificativa_nao_faturada}
            >
              {venda.justificativa_nao_faturada}
            </span>
          )
          : <span className="text-amber-400/60 text-xs italic">Sem justificativa</span>;
      case 'faturada':
        return isFaturada(venda) 
          ? <Check className="h-4 w-4 text-green-400 mx-auto" />
          : <X className="h-4 w-4 text-white/30 mx-auto" />;
      default:
        return null;
    }
  };

  const toggleFilterStatus = (val: string) => {
    setFiltroStatus(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const clearFilters = () => {
    setFiltroStatus([]);
    setSelectedAtendente("todos");
    setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  };

  const hasFilters = filtroStatus.length > 0 || selectedAtendente !== "todos";

  const STATUS_OPTIONS = [
    { value: "faturadas", label: "Faturadas" },
    { value: "nao_faturadas", label: "Não Faturadas" },
  ];

  // Filter sidebar content
  const filterContent = (
    <div className="space-y-6">
      {/* Status */}
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Status</p>
        <div className="space-y-2">
          {STATUS_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-white/80 hover:text-white transition-colors">
              <Checkbox
                checked={filtroStatus.includes(opt.value)}
                onCheckedChange={() => toggleFilterStatus(opt.value)}
                className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Vendedor */}
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Vendedor</p>
        <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {atendentes.map((atendente: any) => (
              <SelectItem key={atendente.user_id} value={atendente.user_id}>{atendente.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Período */}
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Período</p>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-9 bg-white/5 border-white/10 text-white hover:bg-white/10 justify-start",
                dateRange?.from && "border-blue-500/50 text-blue-300"
              )}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(dateRange.to, 'dd/MM', { locale: ptBR })}`
                : "Selecionar período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="w-full text-white/50 hover:text-white hover:bg-white/5" onClick={clearFilters}>
          Limpar Filtros
        </Button>
      )}
    </div>
  );

  // Helper to compute detail values for a venda
  const getVendaDetailValues = (venda: Venda) => {
    const portas = venda.portas || [];
    const valorPortas = portas
      .filter((p: any) => ['porta', 'porta_enrolar'].includes(p.tipo_produto))
      .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
    const valorPintura = portas
      .filter((p: any) => p.tipo_produto === 'pintura_epoxi')
      .reduce((sum: number, p: any) => sum + (p.valor_pintura || 0), 0);
    const valorAcessorios = portas
      .filter((p: any) => p.tipo_produto === 'acessorio')
      .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
    const valorAdicionais = portas
      .filter((p: any) => ['adicional', 'manutencao'].includes(p.tipo_produto))
      .reduce((sum: number, p: any) => sum + (p.valor_produto || 0), 0);
    return { valorPortas, valorPintura, valorAcessorios, valorAdicionais };
  };

  // Right sidebar content
  const lucroLiquido = indicadores.lucroLiquidoTotal;

  const defaultRightContent = (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Resumo</p>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">Faturamento</p>
            <p className="text-lg font-bold text-white">{formatCurrency(stats.faturamento)}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">Faturadas</p>
            <p className="text-lg font-bold text-green-400">{stats.faturadas}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">Pendentes</p>
            <p className="text-lg font-bold text-amber-400">{stats.naoFaturadas}</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50">Lucro Líquido</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(lucroLiquido)}</p>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Colunas</p>
        <ColumnManager
          columns={columns}
          visibleIds={visibleIds}
          onToggle={toggleColumn}
          onReorder={setColumnOrder}
          onReset={resetColumns}
        />
      </div>
    </div>
  );

  const selectedVendaContent = selectedVenda ? (() => {
    const { valorPortas, valorPintura, valorAcessorios, valorAdicionais } = getVendaDetailValues(selectedVenda);
    const detailItems = [
      { label: 'Vl. Portas', value: valorPortas, icon: <DollarSign className="h-3.5 w-3.5" />, color: 'text-blue-400' },
      { label: 'Vl. Pintura', value: valorPintura, icon: <Paintbrush className="h-3.5 w-3.5" />, color: 'text-orange-400' },
      { label: 'Instalação', value: selectedVenda.valor_instalacao || 0, icon: <Wrench className="h-3.5 w-3.5" />, color: 'text-cyan-400' },
      { label: 'Frete', value: selectedVenda.valor_frete || 0, icon: <Truck className="h-3.5 w-3.5" />, color: 'text-amber-400' },
      { label: 'Acessórios', value: valorAcessorios, icon: <Package className="h-3.5 w-3.5" />, color: 'text-pink-400' },
      { label: 'Adicionais', value: valorAdicionais, icon: <PlusCircle className="h-3.5 w-3.5" />, color: 'text-indigo-400' },
    ];
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{selectedVenda.cliente_nome}</p>
            <p className="text-xs text-white/50 mt-0.5">Venda #{selectedVenda.id.substring(0, 8)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white/50 hover:text-white hover:bg-white/10"
            onClick={() => setSelectedVenda(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Valores */}
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Valores</p>
          <div className="grid grid-cols-2 gap-2">
            {detailItems.map((item) => (
              <div key={item.label} className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={item.color}>{item.icon}</span>
                  <p className="text-[10px] text-white/40 uppercase tracking-wide">{item.label}</p>
                </div>
                <p className={cn("text-sm font-semibold", item.value > 0 ? 'text-white' : 'text-white/20')}>
                  {item.value > 0 ? formatCurrency(item.value) : '-'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Datas */}
        <div>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Datas</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-white/40" />
                <p className="text-xs text-white/50">Previsão Entrega</p>
              </div>
              <p className="text-xs font-semibold text-white">
                {selectedVenda.data_prevista_entrega 
                  ? format(new Date(selectedVenda.data_prevista_entrega + 'T12:00:00'), 'dd/MM/yy', { locale: ptBR })
                  : '-'}
              </p>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-white/40" />
                <p className="text-xs text-white/50">Pgto 1</p>
              </div>
              <p className="text-xs font-semibold text-white">
                {selectedVenda.data_pagamento_1 
                  ? format(new Date(selectedVenda.data_pagamento_1 + 'T12:00:00'), 'dd/MM/yy', { locale: ptBR })
                  : '-'}
              </p>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5 text-white/40" />
                <p className="text-xs text-white/50">Pgto 2</p>
              </div>
              <p className="text-xs font-semibold text-white">
                {selectedVenda.data_pagamento_2 
                  ? format(new Date(selectedVenda.data_pagamento_2 + 'T12:00:00'), 'dd/MM/yy', { locale: ptBR })
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Valor a Receber */}
        {selectedVenda.valor_a_receber_faturamento && selectedVenda.valor_a_receber != null && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-blue-400" />
              <p className="text-xs text-blue-400 font-medium">Valor a Receber</p>
            </div>
            <p className="text-lg font-bold text-blue-300">{formatCurrency(selectedVenda.valor_a_receber)}</p>
          </div>
        )}

        {/* Botão Abrir Faturamento */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => navigate(`/direcao/faturamento/venda/${selectedVenda.id}`)}
        >
          Abrir Faturamento
        </Button>
      </div>
    );
  })() : null;

  const rightContent = selectedVenda ? selectedVendaContent : defaultRightContent;

  if (loading) {
    return (
      <MinimalistLayout 
        title="Faturamento" 
        backPath="/direcao"
        breadcrumbItems={[
          { label: "Home", path: "/home" },
          { label: "Direção", path: "/direcao" },
          { label: "Faturamento" }
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
      title="Faturamento" 
      subtitle="Gestão de vendas para faturar"
      backPath="/direcao"
      fullWidth
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Direção", path: "/direcao" },
        { label: "Faturamento" }
      ]}
    >
      {/* Indicadores do Período */}
      <Card className="rounded-xl bg-white/5 border border-white/10 mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white/80 flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-400" />
              Indicadores do Período
            </CardTitle>
            {/* Mobile buttons for sheets */}
            <div className="flex gap-2 lg:hidden">
              <Sheet open={leftSheetOpen} onOpenChange={setLeftSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-zinc-950 border-white/10 w-[280px]">
                  <SheetTitle className="text-white mb-4">Filtros</SheetTitle>
                  {filterContent}
                </SheetContent>
              </Sheet>
              <Sheet open={rightSheetOpen} onOpenChange={setRightSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <PanelRight className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-zinc-950 border-white/10 w-[280px]">
                  <SheetTitle className="text-white mb-4">Resumo</SheetTitle>
                  {rightContent}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {(() => {
              const calcMargem = (lucro: number, bruto: number) =>
                bruto > 0 ? ((lucro / bruto) * 100).toFixed(1) + '%' : '0%';
              const faturamentoTotal = indicadores.valorBrutoPortas + indicadores.valorBrutoPintura + indicadores.valorBrutoInstalacoes + indicadores.valorBrutoAcessorios + indicadores.valorBrutoAdicionais + indicadores.fretesTotais;
              return [
                { key: 'portas', icon: <DollarSign className="h-3 w-3 text-blue-400" />, label: 'Portas', valor: formatCurrency(indicadores.valorBrutoPortas), lucro: formatCurrency(indicadores.lucroPortas), margemLucro: calcMargem(indicadores.lucroPortas, indicadores.valorBrutoPortas), colorClass: 'text-blue-400', qtd: filteredVendas.filter(v => (v.portas || []).some((p: any) => ['porta', 'porta_enrolar', 'porta_social'].includes(p.tipo_produto))).length },
                { key: 'pintura', icon: <Paintbrush className="h-3 w-3 text-orange-400" />, label: 'Pintura', valor: formatCurrency(indicadores.valorBrutoPintura), lucro: formatCurrency(indicadores.lucroPintura), margemLucro: calcMargem(indicadores.lucroPintura, indicadores.valorBrutoPintura), colorClass: 'text-orange-400', qtd: filteredVendas.filter(v => (v.portas || []).some((p: any) => p.tipo_produto === 'pintura_epoxi')).length },
                { key: 'instalacoes', icon: <Wrench className="h-3 w-3 text-cyan-400" />, label: 'Instalações', valor: formatCurrency(indicadores.valorBrutoInstalacoes), lucro: formatCurrency(indicadores.lucroInstalacoes), margemLucro: calcMargem(indicadores.lucroInstalacoes, indicadores.valorBrutoInstalacoes), colorClass: 'text-cyan-400', qtd: filteredVendas.filter(v => (v.valor_instalacao || 0) > 0).length },
                { key: 'acessorios', icon: <Package className="h-3 w-3 text-pink-400" />, label: 'Acessórios', valor: formatCurrency(indicadores.valorBrutoAcessorios), lucro: formatCurrency(indicadores.lucroAcessorios), margemLucro: calcMargem(indicadores.lucroAcessorios, indicadores.valorBrutoAcessorios), colorClass: 'text-pink-400', qtd: filteredVendas.filter(v => (v.portas || []).some((p: any) => p.tipo_produto === 'acessorio')).length },
                { key: 'adicionais', icon: <PlusCircle className="h-3 w-3 text-indigo-400" />, label: 'Adicionais', valor: formatCurrency(indicadores.valorBrutoAdicionais), lucro: formatCurrency(indicadores.lucroAdicionais), margemLucro: calcMargem(indicadores.lucroAdicionais, indicadores.valorBrutoAdicionais), colorClass: 'text-indigo-400', qtd: filteredVendas.filter(v => (v.portas || []).some((p: any) => ['adicional', 'manutencao'].includes(p.tipo_produto))).length },
                { key: 'fretes', icon: <Truck className="h-3 w-3 text-amber-400" />, label: 'Fretes', valor: formatCurrency(indicadores.fretesTotais), colorClass: 'text-amber-400', qtd: filteredVendas.filter(v => (v.valor_frete || 0) > 0).length },
                { key: 'lucro', icon: <TrendingUp className="h-3 w-3 text-green-400" />, label: 'Lucro Líquido', valor: formatCurrency(indicadores.lucroLiquidoTotal), margemLucro: calcMargem(indicadores.lucroLiquidoTotal, faturamentoTotal), colorClass: 'text-green-400', qtd: filteredVendas.filter(isFaturada).length },
              ].map((ind) => {
                const clickableKeys = ['portas', 'pintura', 'instalacoes', 'acessorios', 'adicionais'];
                return (
                  <IndicadorExpandivel
                    key={ind.key}
                    icon={ind.icon}
                    label={ind.label}
                    valor={ind.valor}
                    lucro={'lucro' in ind ? (ind as any).lucro : undefined}
                    margemLucro={ind.margemLucro}
                    colorClass={ind.colorClass}
                    quantidadeVendas={ind.qtd}
                    onClick={clickableKeys.includes(ind.key) ? () => {
                      setIndicadorAtivo(ind.key);
                      setIndicadorDrawerOpen(true);
                    } : undefined}
                  />
                );
              });
            })()}
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

      {/* 3-panel layout */}
      <div className="flex gap-4">
        {/* Left sidebar - desktop only */}
        <aside className="hidden lg:block w-[250px] shrink-0">
          <div className="sticky top-24 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm font-semibold text-white mb-4">Filtros</p>
            {filterContent}
          </div>
        </aside>

        {/* Main table */}
        <main className="flex-1 min-w-0">
          {/* Search bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Buscar cliente, vendedor, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9"
              />
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
            <TooltipProvider delayDuration={200}>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="w-8 text-center text-white/60" />
                    {visibleColumns.map((column) => (
                      <TableHead 
                        key={column.id}
                        className={`text-white/60 cursor-pointer hover:text-white/80 transition-colors ${getColumnResponsiveClass(column.id)} ${getColumnAlignment(column.id)}`}
                        onClick={() => handleSort(column.id)}
                      >
                        <div className={`flex items-center ${getColumnAlignment(column.id) === 'text-right' ? 'justify-end' : getColumnAlignment(column.id) === 'text-center' ? 'justify-center' : ''}`}>
                          {column.label}
                          {getSortIcon(column.id)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVendas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-white/40">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedVendas.map((venda) => (
                      <TableRow 
                        key={venda.id} 
                        className={cn(
                          "border-white/10 hover:bg-white/5 cursor-pointer",
                          selectedVenda?.id === venda.id && "bg-blue-500/10 border-l-2 border-l-blue-500"
                        )}
                        onClick={() => {
                          setSelectedVenda(venda);
                          if (isMobile) setMobileDownbarOpen(true);
                        }}
                      >
                        <TableCell className="w-8 text-center">
                          <div className={cn(
                            "h-3 w-3 rounded-full border-2 mx-auto transition-colors",
                            selectedVenda?.id === venda.id 
                              ? "bg-blue-500 border-blue-500" 
                              : "border-white/20"
                          )} />
                        </TableCell>
                        {visibleColumns.map((column) => (
                          <TableCell 
                            key={column.id}
                            className={`${getColumnResponsiveClass(column.id)} ${getColumnAlignment(column.id)}`}
                          >
                            {renderCell(venda, column.id)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        </main>

        {/* Right sidebar - desktop only */}
        <aside className="hidden lg:block w-[250px] shrink-0">
          <div className="sticky top-24 p-4 rounded-xl bg-white/5 border border-white/10">
            {rightContent}
          </div>
        </aside>
      </div>

      {/* Mobile Downbar */}
      {isMobile && (
        <Drawer open={mobileDownbarOpen} onOpenChange={(open) => {
          setMobileDownbarOpen(open);
          if (!open) setSelectedVenda(null);
        }}>
          <DrawerContent className="max-h-[85vh] bg-zinc-900 border-t border-white/10">
            <ScrollArea className="h-[75vh] px-4 py-4">
              {selectedVenda && selectedVendaContent}
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      )}

      {/* Indicator Ranking Drawer */}
      <Drawer open={indicadorDrawerOpen} onOpenChange={setIndicadorDrawerOpen}>
        <DrawerContent className="max-h-[85vh] bg-zinc-900 border-t border-white/10">
          <div className="mx-auto w-full max-w-lg">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2">
              {indicadorAtivo && indicadorIcons[indicadorAtivo]}
              <h3 className="text-white font-semibold">Ranking - {indicadorAtivo ? indicadorTitulos[indicadorAtivo] : ''}</h3>
            </div>
            <ScrollArea className="h-[65vh] px-4 pb-4">
              {rankingData.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-8">Nenhum dado encontrado</p>
              ) : (
                rankingData.map((item, index) => (
                  <div key={item.nome} className="flex items-center justify-between py-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-white/30 text-sm w-6">{index + 1}.</span>
                      {item.cor_hex && (
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.cor_hex }} />
                      )}
                      <span className="text-white text-sm">{item.nome}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">{item.quantidade}x</p>
                      <p className="text-white/50 text-xs">{formatCurrency(item.valor_total)}</p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
        </DrawerContent>
      </Drawer>
    </MinimalistLayout>
  );
}
