import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface RHMetrics {
  totalColaboradores: number;
  aniversariantesMes: { nome: string; data: string }[];
  admicoesDesligamentos: { admissoes: number; desligamentos: number };
  documentosPendentes: number;
  distribuicaoPorRole: { role: string; total: number }[];
}

export const useRHDashboard = () => {
  return useQuery({
    queryKey: ['rh-dashboard'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje).toISOString();
      const fimMes = endOfMonth(hoje).toISOString();

      // Colaboradores ativos
      const { data: usuarios } = await supabase
        .from('admin_users')
        .select('*')
        .eq('ativo', true);

      const totalColaboradores = usuarios?.length || 0;

      // Admissões no mês
      const admissoes = usuarios?.filter(u => 
        u.created_at >= inicioMes && u.created_at <= fimMes
      ).length || 0;

      // Distribuição por cargo
      const distribuicaoPorRole = usuarios?.reduce((acc: { [key: string]: number }, u) => {
        const role = u.role || 'Não definido';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const rolesArray = Object.entries(distribuicaoPorRole || {})
        .map(([role, total]) => ({ role, total: total as number }))
        .sort((a, b) => b.total - a.total);

      const metrics: RHMetrics = {
        totalColaboradores,
        aniversariantesMes: [],
        admicoesDesligamentos: {
          admissoes,
          desligamentos: 0,
        },
        documentosPendentes: 0,
        distribuicaoPorRole: rolesArray,
      };

      return metrics;
    },
    staleTime: 1000 * 60 * 5,
  });
};
