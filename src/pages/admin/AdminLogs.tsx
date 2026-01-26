import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Package, Boxes, CheckSquare, Search, Filter } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSessionFilters } from '@/hooks/useSessionFilters';

type LogType = 'todos' | 'pedidos' | 'estoque' | 'tarefas';
type PeriodType = '7' | '30' | '90' | '365';

interface UnifiedLog {
  id: string;
  type: 'pedido' | 'estoque' | 'tarefa';
  description: string;
  created_at: string;
  user_name: string | null;
}

export default function AdminLogs() {
  const [searchTerm, setSearchTerm] = useSessionFilters<string>({ key: 'admin_logs_search', defaultValue: '' });
  const [logType, setLogType] = useSessionFilters<LogType>({ key: 'admin_logs_type', defaultValue: 'todos' });
  const [period, setPeriod] = useSessionFilters<PeriodType>({ key: 'admin_logs_period', defaultValue: '7' });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-logs', logType, period, searchTerm],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));
      const startDateStr = startDate.toISOString();

      const allLogs: UnifiedLog[] = [];

      // Fetch pedidos_movimentacoes
      if (logType === 'todos' || logType === 'pedidos') {
        const { data: pedidosLogs } = await supabase
          .from('pedidos_movimentacoes')
          .select(`
            id,
            etapa_origem,
            etapa_destino,
            descricao,
            teor,
            created_at,
            user_id,
            pedido_id,
            pedidos_producao!inner(numero_pedido)
          `)
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: false })
          .limit(200);

        if (pedidosLogs) {
          // Fetch user names
          const userIds = [...new Set(pedidosLogs.map(l => l.user_id).filter(Boolean))] as string[];
          
          let userMap = new Map<string, string>();
          if (userIds.length > 0) {
            const { data: users } = await supabase
              .from('admin_users')
              .select('user_id, nome')
              .in('user_id', userIds);
            userMap = new Map(users?.map(u => [u.user_id, u.nome]) || []);
          }

          for (const log of pedidosLogs) {
            const pedido = log.pedidos_producao as { numero_pedido: string } | null;
            const desc = log.descricao || log.teor || `${formatEtapa(log.etapa_origem)} → ${formatEtapa(log.etapa_destino)}`;
            allLogs.push({
              id: `pedido-${log.id}`,
              type: 'pedido',
              description: `Pedido ${pedido?.numero_pedido || 'N/A'}: ${desc}`,
              created_at: log.created_at,
              user_name: log.user_id ? (userMap.get(log.user_id) ?? null) : null,
            });
          }
        }
      }

      // Fetch estoque_movimentacoes
      if (logType === 'todos' || logType === 'estoque') {
        const { data: estoqueLogs } = await supabase
          .from('estoque_movimentacoes')
          .select(`
            id,
            tipo_movimentacao,
            quantidade,
            quantidade_anterior,
            quantidade_nova,
            observacoes,
            created_at,
            created_by,
            produto_id,
            estoque!inner(nome_produto)
          `)
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: false })
          .limit(200);

        if (estoqueLogs) {
          const userIds = [...new Set(estoqueLogs.map(l => l.created_by).filter(Boolean))] as string[];
          
          let userMap = new Map<string, string>();
          if (userIds.length > 0) {
            const { data: users } = await supabase
              .from('admin_users')
              .select('user_id, nome')
              .in('user_id', userIds);
            userMap = new Map(users?.map(u => [u.user_id, u.nome]) || []);
          }

          for (const log of estoqueLogs) {
            const produto = log.estoque as { nome_produto: string } | null;
            allLogs.push({
              id: `estoque-${log.id}`,
              type: 'estoque',
              description: `${formatTipoMovimentacao(log.tipo_movimentacao)} de ${Math.abs(log.quantidade)} un. - ${produto?.nome_produto || 'Produto'}${log.observacoes ? ` (${log.observacoes})` : ''}`,
              created_at: log.created_at,
              user_name: log.created_by ? (userMap.get(log.created_by) ?? null) : null,
            });
          }
        }
      }

      // Fetch tarefas_historico
      if (logType === 'todos' || logType === 'tarefas') {
        const { data: tarefasLogs } = await supabase
          .from('tarefas_historico')
          .select(`
            id,
            data_conclusao,
            concluida_por,
            created_at,
            tarefas_templates(descricao)
          `)
          .gte('created_at', startDateStr)
          .order('created_at', { ascending: false })
          .limit(200);

        if (tarefasLogs) {
          const userIds = [...new Set(tarefasLogs.map(l => l.concluida_por).filter(Boolean))] as string[];
          
          let userMap = new Map<string, string>();
          if (userIds.length > 0) {
            const { data: users } = await supabase
              .from('admin_users')
              .select('user_id, nome')
              .in('user_id', userIds);
            userMap = new Map(users?.map(u => [u.user_id, u.nome]) || []);
          }

          for (const log of tarefasLogs) {
            const template = log.tarefas_templates as { descricao: string } | null;
            allLogs.push({
              id: `tarefa-${log.id}`,
              type: 'tarefa',
              description: `Tarefa concluída: ${template?.descricao || 'Tarefa'}`,
              created_at: log.data_conclusao || log.created_at,
              user_name: log.concluida_por ? (userMap.get(log.concluida_por) ?? null) : null,
            });
          }
        }
      }

      // Sort by date descending
      allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return allLogs.filter(log => 
          log.description.toLowerCase().includes(term) ||
          (log.user_name && log.user_name.toLowerCase().includes(term))
        );
      }

      return allLogs;
    },
  });

  const getLogIcon = (type: UnifiedLog['type']) => {
    switch (type) {
      case 'pedido':
        return <Package className="w-4 h-4" />;
      case 'estoque':
        return <Boxes className="w-4 h-4" />;
      case 'tarefa':
        return <CheckSquare className="w-4 h-4" />;
    }
  };

  const getLogColor = (type: UnifiedLog['type']) => {
    switch (type) {
      case 'pedido':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'estoque':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'tarefa':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getLogLabel = (type: UnifiedLog['type']) => {
    switch (type) {
      case 'pedido':
        return 'Pedido';
      case 'estoque':
        return 'Estoque';
      case 'tarefa':
        return 'Tarefa';
    }
  };

  return (
    <MinimalistLayout
      title="Logs do Sistema"
      subtitle="Histórico de ações e movimentações"
      backPath="/admin"
    >
      {/* Filtros */}
      <Card className="mb-4 bg-white/5 border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Buscar nos logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            
            <Select value={logType} onValueChange={(v) => setLogType(v as LogType)}>
              <SelectTrigger className="w-full md:w-40 bg-white/5 border-white/10 text-white">
                <Filter className="w-4 h-4 mr-2 text-white/60" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pedidos">Pedidos</SelectItem>
                <SelectItem value="estoque">Estoque</SelectItem>
                <SelectItem value="tarefas">Tarefas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <SelectTrigger className="w-full md:w-40 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {logs && (
            <p className="text-sm text-white/50 mt-3">
              Mostrando {logs.length} {logs.length === 1 ? 'log' : 'logs'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-12 text-white/50">
            Carregando logs...
          </div>
        ) : logs && logs.length > 0 ? (
          logs.map((log) => (
            <Card 
              key={log.id} 
              className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getLogColor(log.type)}`}>
                    {getLogIcon(log.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${getLogColor(log.type)}`}>
                        {getLogLabel(log.type)}
                      </Badge>
                      <span className="text-xs text-white/40">
                        {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-white/90 break-words">
                      {log.description}
                    </p>
                    
                    {log.user_name && (
                      <p className="text-xs text-white/40 mt-1">
                        por {log.user_name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-white/50">
            Nenhum log encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </MinimalistLayout>
  );
}

function formatEtapa(etapa: string | null): string {
  if (!etapa) return 'N/A';
  const etapas: Record<string, string> = {
    aguardando_faturamento: 'Aguardando Faturamento',
    em_producao: 'Em Produção',
    inspecao_qualidade: 'Inspeção de Qualidade',
    aguardando_pintura: 'Aguardando Pintura',
    em_pintura: 'Em Pintura',
    aguardando_instalacao: 'Aguardando Instalação',
    instalado: 'Instalado',
    concluido: 'Concluído',
  };
  return etapas[etapa] || etapa;
}

function formatTipoMovimentacao(tipo: string): string {
  const tipos: Record<string, string> = {
    entrada: 'Entrada',
    saida: 'Saída',
    ajuste: 'Ajuste',
    producao: 'Produção',
    transferencia: 'Transferência',
  };
  return tipos[tipo] || tipo;
}
