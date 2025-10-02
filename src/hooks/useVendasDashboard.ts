import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export interface VendaDia {
  data: string;
  valor: number;
  numero_vendas: number;
}

export interface VendaDetalhada {
  id: string;
  cliente_nome: string;
  valor_venda: number;
  atendente_id: string;
  atendente_nome?: string;
  data_venda: string;
}

export const useVendasAgregadas = (year: number) => {
  return useQuery({
    queryKey: ['vendas-agregadas', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          data_venda,
          valor_venda,
          atendente_id,
          admin_users!vendas_atendente_id_fkey(nome)
        `)
        .gte('data_venda', `${year}-01-01`)
        .lte('data_venda', `${year}-12-31`)
        .order('data_venda', { ascending: true });

      if (error) throw error;

      // Agregar por data
      const agregado = data.reduce((acc: Record<string, VendaDia>, venda) => {
        const data = venda.data_venda.split('T')[0];
        
        if (!acc[data]) {
          acc[data] = {
            data,
            valor: 0,
            numero_vendas: 0
          };
        }
        
        acc[data].valor += venda.valor_venda || 0;
        acc[data].numero_vendas += 1;
        
        return acc;
      }, {});

      return Object.values(agregado);
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });
};

export const useVendasDoDia = (data: string) => {
  return useQuery({
    queryKey: ['vendas-dia', data],
    queryFn: async () => {
      const { data: vendas, error } = await supabase
        .from('vendas')
        .select(`
          id,
          cliente_nome,
          valor_venda,
          atendente_id,
          data_venda,
          admin_users!vendas_atendente_id_fkey(nome)
        `)
        .gte('data_venda', `${data}T00:00:00`)
        .lte('data_venda', `${data}T23:59:59`)
        .order('data_venda', { ascending: false });

      if (error) throw error;

      return vendas.map((v: any) => ({
        id: v.id,
        cliente_nome: v.cliente_nome,
        valor_venda: v.valor_venda,
        atendente_id: v.atendente_id,
        data_venda: v.data_venda,
        atendente_nome: v.admin_users?.nome
      })) as VendaDetalhada[];
    },
    enabled: !!data,
  });
};

export const useVendasMesAtual = () => {
  const now = new Date();
  const inicio = startOfMonth(now);
  const fim = endOfMonth(now);

  return useQuery({
    queryKey: ['vendas-mes-atual', inicio.toISOString(), fim.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('valor_venda')
        .gte('data_venda', inicio.toISOString())
        .lte('data_venda', fim.toISOString());

      if (error) throw error;

      const total = data.reduce((sum, v) => sum + (v.valor_venda || 0), 0);
      const quantidade = data.length;

      return { total, quantidade };
    },
    refetchInterval: 60000,
  });
};

export const useVendasSemanaAtual = () => {
  const now = new Date();
  const inicio = startOfWeek(now, { weekStartsOn: 0 });
  const fim = endOfWeek(now, { weekStartsOn: 0 });

  return useQuery({
    queryKey: ['vendas-semana-atual', inicio.toISOString(), fim.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('valor_venda')
        .gte('data_venda', inicio.toISOString())
        .lte('data_venda', fim.toISOString());

      if (error) throw error;

      const total = data.reduce((sum, v) => sum + (v.valor_venda || 0), 0);
      const quantidade = data.length;

      return { total, quantidade };
    },
    refetchInterval: 60000,
  });
};
