import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  PackageCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface VendaFaturadaSemPedido {
  id: string;
  data_venda: string;
  cliente_nome: string | null;
  atendente_nome: string;
  atendente_foto: string | null;
  valor_venda: number;
  valor_credito: number;
  dias_desde_faturamento: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function VendasFaturadasSemPedido() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState<VendaFaturadaSemPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchVendasFaturadasSemPedido();
  }, []);

  const fetchVendasFaturadasSemPedido = async () => {
    try {
      const tresMesesAtras = subMonths(new Date(), 3);
      const dataLimite = format(tresMesesAtras, "yyyy-MM-dd");

      // 1. Buscar vendas dos últimos 3 meses com produtos
      const { data: vendasData, error } = await supabase
        .from("vendas")
        .select(`
          id,
          data_venda,
          cliente_nome,
          atendente_id,
          valor_venda,
          valor_credito,
          produtos_vendas (
            id,
            faturamento
          )
        `)
        .gte("data_venda", dataLimite + " 00:00:00")
        .order("data_venda", { ascending: false });

      if (error) throw error;
      if (!vendasData || vendasData.length === 0) {
        setVendas([]);
        return;
      }

      // 2. Filtrar vendas totalmente faturadas (todos os produtos com faturamento = true)
      const vendasFaturadas = vendasData.filter((venda: any) => {
        const produtos = venda.produtos_vendas || [];
        // Precisa ter pelo menos 1 produto e todos devem estar faturados
        return produtos.length > 0 && produtos.every((p: any) => p.faturamento === true);
      });

      if (vendasFaturadas.length === 0) {
        setVendas([]);
        return;
      }

      // 3. Verificar quais NÃO têm pedido de produção
      const vendasIds = vendasFaturadas.map((v: any) => v.id);
      const { data: pedidos } = await supabase
        .from("pedidos_producao")
        .select("venda_id")
        .in("venda_id", vendasIds);

      const vendasComPedido = new Set(pedidos?.map(p => p.venda_id) || []);
      const vendasSemPedido = vendasFaturadas.filter((v: any) => !vendasComPedido.has(v.id));

      if (vendasSemPedido.length === 0) {
        setVendas([]);
        return;
      }

      // 4. Buscar dados dos atendentes
      const { data: usuarios } = await supabase
        .from("admin_users")
        .select("user_id, nome, foto_perfil_url");

      const atendenteMap = new Map();
      if (usuarios) {
        usuarios.forEach(user => {
          atendenteMap.set(user.user_id, { nome: user.nome, foto: user.foto_perfil_url });
        });
      }

      // 5. Processar vendas
      const hoje = new Date();
      const vendasProcessadas: VendaFaturadaSemPedido[] = vendasSemPedido.map((venda: any) => {
        const atendenteData = venda.atendente_id ? atendenteMap.get(venda.atendente_id) : null;
        const dataVenda = new Date(venda.data_venda);
        const diasDesdeFaturamento = Math.floor((hoje.getTime() - dataVenda.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: venda.id,
          data_venda: venda.data_venda,
          cliente_nome: venda.cliente_nome,
          atendente_nome: atendenteData?.nome || "Não identificado",
          atendente_foto: atendenteData?.foto || null,
          valor_venda: venda.valor_venda || 0,
          valor_credito: venda.valor_credito || 0,
          dias_desde_faturamento: diasDesdeFaturamento
        };
      });

      // Ordenar por dias desde faturamento (mais antigos primeiro)
      vendasProcessadas.sort((a, b) => b.dias_desde_faturamento - a.dias_desde_faturamento);

      setVendas(vendasProcessadas);
    } catch (error) {
      console.error("Erro ao buscar vendas faturadas sem pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (dias: number) => {
    if (dias >= 60) return "text-red-400 bg-red-500/20 border-red-500/30";
    if (dias >= 30) return "text-orange-400 bg-orange-500/20 border-orange-500/30";
    return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10 mb-4">
        <CardHeader>
          <Skeleton className="h-6 w-64 bg-white/10" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 bg-white/10" />
        </CardContent>
      </Card>
    );
  }

  if (vendas.length === 0) {
    return null;
  }

  const vendasExibidas = isExpanded ? vendas : vendas.slice(0, 5);

  return (
    <Card className="bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/20 mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white/80 flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-emerald-400" />
            Vendas Faturadas Sem Pedido (Últimos 3 Meses)
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2">
              {vendas.length}
            </Badge>
          </CardTitle>
          {vendas.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Ver todas ({vendas.length})
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/70">Data</TableHead>
                <TableHead className="text-white/70">Cliente</TableHead>
                <TableHead className="text-white/70">Atendente</TableHead>
                <TableHead className="text-white/70">Dias</TableHead>
                <TableHead className="text-white/70 text-right">Valor</TableHead>
                <TableHead className="text-white/70 text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendasExibidas.map((venda) => (
                <TableRow 
                  key={venda.id} 
                  className="border-white/10 hover:bg-white/5 cursor-pointer"
                  onClick={() => navigate(`/administrativo/financeiro/faturamento/${venda.id}?from=pedidos`)}
                >
                  <TableCell className="text-white/80">
                    {format(new Date(venda.data_venda), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {venda.cliente_nome || "Não informado"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={venda.atendente_foto || undefined} />
                        <AvatarFallback className="text-xs bg-white/20 text-white">
                          {venda.atendente_nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-white/80 text-sm">{venda.atendente_nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("font-medium", getUrgencyColor(venda.dias_desde_faturamento))}>
                      <Clock className="h-3 w-3 mr-1" />
                      {venda.dias_desde_faturamento} dias
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-white font-semibold">
                      {formatCurrency(venda.valor_venda + venda.valor_credito)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/administrativo/financeiro/faturamento/${venda.id}?from=pedidos`);
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Resumo */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-white/50">
              Total: <span className="text-white font-semibold">
                {formatCurrency(vendas.reduce((acc, v) => acc + v.valor_venda + v.valor_credito, 0))}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white/50">&lt; 30 dias</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-white/50">30-60 dias</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-white/50">&gt; 60 dias</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
