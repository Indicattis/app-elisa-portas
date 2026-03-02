import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface OrdemHistoricoMinimalista {
  id: string;
  numero_ordem: string;
  setor: 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';
  status: string;
  data_conclusao: string;
  tempo_conclusao_segundos: number | null;
  pedido_id: string;
  cliente_nome?: string;
  cores?: Array<{ nome: string; codigo_hex: string }>;
}

type SetorType = 'todos' | 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura';

interface UseMeuHistoricoMinimalistaOptions {
  periodo?: 'hoje' | 'semana' | 'mes' | 'todos';
  setor?: SetorType;
}

export function useMeuHistoricoMinimalista(options: UseMeuHistoricoMinimalistaOptions = {}) {
  const { user } = useAuth();
  const { periodo = 'todos', setor = 'todos' } = options;

  const getDataInicio = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (periodo) {
      case 'hoje':
        return hoje.toISOString();
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        return inicioSemana.toISOString();
      case 'mes':
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        return inicioMes.toISOString();
      default:
        return null;
    }
  };

  return useQuery({
    queryKey: ['meu-historico-producao-minimalista', user?.id, periodo, setor],
    queryFn: async () => {
      if (!user?.id) return [];

      const dataInicio = getDataInicio();
      const ordens: OrdemHistoricoMinimalista[] = [];

      // Definir quais setores buscar
      const setores = setor === 'todos' 
        ? ['soldagem', 'perfiladeira', 'separacao', 'qualidade', 'pintura'] as const
        : [setor] as const;

      // Buscar de cada tabela de ordens
      for (const setorAtual of setores) {
        const tabela = `ordens_${setorAtual}` as const;
        
        let query = supabase
          .from(tabela)
          .select(`
            id,
            numero_ordem,
            status,
            data_conclusao,
            tempo_conclusao_segundos,
            pedido_id,
            pedido:pedidos_producao(cliente_nome, venda:vendas(produtos:produtos_vendas(tipo_produto, cor:catalogo_cores(nome, codigo_hex))))
          `)
          .eq('responsavel_id', user.id)
          .eq('status', 'concluido')
          .order('data_conclusao', { ascending: false });

        if (dataInicio) {
          query = query.gte('data_conclusao', dataInicio);
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Erro ao buscar ordens de ${setorAtual}:`, error);
          continue;
        }

        if (data) {
          ordens.push(...data.map((ordem: any) => {
            // Extrair cores únicas de portas de enrolar e pintura epóxi
            const coresMap = new Map<string, { nome: string; codigo_hex: string }>();
            const produtos = ordem.pedido?.venda?.produtos || [];
            produtos.forEach((p: any) => {
              if ((p.tipo_produto === 'porta_enrolar' || p.tipo_produto === 'porta' || p.tipo_produto === 'pintura_epoxi') && p.cor) {
                coresMap.set(p.cor.nome, p.cor);
              }
            });

            return {
              id: ordem.id,
              numero_ordem: ordem.numero_ordem,
              setor: setorAtual,
              status: ordem.status,
              data_conclusao: ordem.data_conclusao,
              tempo_conclusao_segundos: ordem.tempo_conclusao_segundos,
              pedido_id: ordem.pedido_id,
              cliente_nome: ordem.pedido?.cliente_nome,
              cores: Array.from(coresMap.values()),
            };
          }));
        }
      }

      // Ordenar por data de conclusão (mais recentes primeiro)
      return ordens.sort((a, b) => 
        new Date(b.data_conclusao).getTime() - new Date(a.data_conclusao).getTime()
      );
    },
    enabled: !!user?.id,
  });
}
