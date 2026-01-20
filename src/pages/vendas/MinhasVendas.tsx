import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Eye, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
          nome_cliente,
          valor_venda,
          data_venda,
          status,
          venda_faturada
        `)
        .eq('atendente_id', user.id)
        .gte('data_venda', inicioMes.toISOString())
        .lte('data_venda', fimMes.toISOString())
        .order('data_venda', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const totalVendas = vendas?.length || 0;
  const valorTotal = vendas?.reduce((acc, v) => acc + (v.valor_venda || 0), 0) || 0;
  const vendasFaturadas = vendas?.filter(v => v.venda_faturada).length || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'em_andamento': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluida': return 'Concluída';
      case 'em_andamento': return 'Em Andamento';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <MinimalistLayout 
      title="Minhas Vendas" 
      subtitle={format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
      headerActions={
        <Button 
          onClick={() => navigate('/dashboard/vendas/nova')}
          className="bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </Button>
      }
    >
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Total de Vendas</p>
              <p className="text-2xl font-bold text-white">{totalVendas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Valor Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(valorTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-white/60">Faturadas</p>
              <p className="text-2xl font-bold text-white">{vendasFaturadas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de vendas */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-white/5" />
          ))
        ) : vendas && vendas.length > 0 ? (
          vendas.map((venda) => (
            <div
              key={venda.id}
              onClick={() => navigate(`/dashboard/vendas/${venda.id}`)}
              className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm
                         hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(venda.status || '')}`}>
                      {getStatusLabel(venda.status || '')}
                    </span>
                    {venda.venda_faturada && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        Faturada
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-medium">{venda.nome_cliente}</h3>
                  <p className="text-sm text-white/60">
                    {format(new Date(venda.data_venda), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {formatCurrency(venda.valor_venda || 0)}
                  </p>
                  <Eye className="w-4 h-4 text-white/40 ml-auto mt-2" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Nenhuma venda encontrada neste mês</p>
            <Button 
              onClick={() => navigate('/dashboard/vendas/nova')}
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira venda
            </Button>
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}
