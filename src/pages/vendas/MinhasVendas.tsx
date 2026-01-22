import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Eye, TrendingUp, ShoppingCart, DollarSign, FileCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Venda {
  id: string;
  cliente_nome: string | null;
  valor_venda: number | null;
  data_venda: string;
  comprovante_url: string | null;
  pedidos_producao: { status: string } | null;
}

export default function MinhasVendas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mesAtual] = useState(new Date());

  const inicioMes = startOfMonth(mesAtual);
  const fimMes = endOfMonth(mesAtual);

  const { data: vendas, isLoading } = useQuery({
    queryKey: ['minhas-vendas', user?.id, format(mesAtual, 'yyyy-MM')],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          cliente_nome,
          valor_venda,
          data_venda,
          comprovante_url,
          pedidos_producao!left(status)
        `)
        .eq('atendente_id', user.id)
        .gte('data_venda', inicioMes.toISOString())
        .lte('data_venda', fimMes.toISOString())
        .order('data_venda', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Venda[];
    },
    enabled: !!user?.id
  });

  const totalVendas = vendas?.length || 0;
  const valorTotal = vendas?.reduce((acc, v) => acc + (v.valor_venda || 0), 0) || 0;
  const vendasFaturadas = vendas?.filter(v => v.comprovante_url).length || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'concluido': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'em_producao': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pendente': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/10 text-blue-300/70 border-blue-500/20';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'em_producao': return 'Em Produção';
      case 'cancelado': return 'Cancelado';
      case 'pendente': return 'Pendente';
      default: return status || 'Aguardando';
    }
  };

  // Estilos sofisticados com azul
  const cardClass = "p-1.5 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-900/10 backdrop-blur-xl border border-blue-500/20";
  const statCardInner = "p-4 flex items-center gap-4";

  return (
    <MinimalistLayout 
      title="Minhas Vendas" 
      subtitle={format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Minhas Vendas" }
      ]}
      headerActions={
        <button 
          onClick={() => navigate('/vendas/minhas-vendas/nova')}
          className="h-10 px-5 rounded-lg font-medium text-white border
                     bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30 
                     shadow-lg shadow-blue-500/30
                     hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40
                     transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Venda
        </button>
      }
    >
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={cardClass}>
          <div className={statCardInner}>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-300/70 uppercase tracking-wider">Total de Vendas</p>
              <p className="text-2xl font-bold text-white">{totalVendas}</p>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className={statCardInner}>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-lg shadow-green-500/30">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-300/70 uppercase tracking-wider">Valor Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(valorTotal)}</p>
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className={statCardInner}>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-500/30">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-300/70 uppercase tracking-wider">Com Comprovante</p>
              <p className="text-2xl font-bold text-white">{vendasFaturadas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de vendas */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-blue-500/5 border border-blue-500/10" />
          ))
        ) : vendas && vendas.length > 0 ? (
          vendas.map((venda) => {
            const status = venda.pedidos_producao?.status || null;
            
            return (
              <div
                key={venda.id}
                onClick={() => navigate(`/dashboard/vendas/${venda.id}`)}
                className="p-1.5 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-900/10 backdrop-blur-xl border border-blue-500/20
                           hover:from-blue-500/10 hover:to-blue-800/15 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/10
                           transition-all duration-200 cursor-pointer group"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                        {venda.comprovante_url && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                            Pago
                          </span>
                        )}
                      </div>
                      <h3 className="text-blue-100 font-medium group-hover:text-white transition-colors">
                        {venda.cliente_nome || 'Cliente não informado'}
                      </h3>
                      <p className="text-sm text-blue-300/60">
                        {format(new Date(venda.data_venda), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(venda.valor_venda || 0)}
                      </p>
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 mt-2 group-hover:bg-blue-500/20 transition-colors">
                        <Eye className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={cn(cardClass, "text-center py-12")}>
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-blue-400/50" />
            </div>
            <p className="text-blue-200/60 mb-4">Nenhuma venda encontrada neste mês</p>
            <button 
              onClick={() => navigate('/vendas/minhas-vendas/nova')}
              className="h-10 px-5 rounded-lg font-medium border border-blue-500/30 bg-blue-500/10 text-blue-300
                         hover:bg-blue-500/20 hover:text-blue-200 hover:border-blue-400/50
                         transition-all duration-200 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar primeira venda
            </button>
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
