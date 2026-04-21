import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { calcularFaturamentoLiquido, isVendaValida } from "@/utils/faturamentoCalc";

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
  atendente_foto?: string | null;
  data_venda: string;
}

export interface RankingVendedor {
  atendente_nome: string;
  foto_perfil_url: string | null;
  quantidade_vendas: number;
  quantidade_portas: number;
  valor_total: number;
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
          valor_frete,
          valor_credito,
          atendente_id,
          admin_users!fk_vendas_atendente(nome)
        `)
        .gte('data_venda', `${year}-01-01`)
        .lte('data_venda', `${year}-12-31`)
        .order('data_venda', { ascending: true });

      if (error) throw error;

      // Agregar por data (excluindo frete)
      const agregado = data.reduce((acc: Record<string, VendaDia>, venda) => {
        const data = venda.data_venda.split('T')[0];
        if (!isVendaValida(venda)) return acc;

        if (!acc[data]) {
          acc[data] = {
            data,
            valor: 0,
            numero_vendas: 0
          };
        }
        
        acc[data].valor += calcularFaturamentoLiquido(venda);
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
          admin_users!fk_vendas_atendente(nome, foto_perfil_url)
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
        atendente_nome: v.admin_users?.nome,
        atendente_foto: v.admin_users?.foto_perfil_url
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
        .select('valor_venda, valor_frete, valor_credito')
        .gte('data_venda', inicio.toISOString())
        .lte('data_venda', fim.toISOString());

      if (error) throw error;

      const validas = data.filter(isVendaValida);
      const total = validas.reduce((sum, v) => sum + calcularFaturamentoLiquido(v), 0);
      const quantidade = validas.length;

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
        .select('valor_venda, valor_frete, valor_credito')
        .gte('data_venda', inicio.toISOString())
        .lte('data_venda', fim.toISOString());

      if (error) throw error;

      const validas = data.filter(isVendaValida);
      const total = validas.reduce((sum, v) => sum + calcularFaturamentoLiquido(v), 0);
      const quantidade = validas.length;

      return { total, quantidade };
    },
    refetchInterval: 60000,
  });
};

export function useRankingVendedoresDia(data: string) {
  return useQuery({
    queryKey: ['ranking-vendedores-dia', data],
    queryFn: async () => {
      if (!data) return [];

      const { data: vendas, error } = await supabase
        .from('vendas')
        .select(`
          id,
          valor_venda,
          valor_frete,
          valor_credito,
          atendente:admin_users!fk_vendas_atendente(nome, foto_perfil_url),
          produtos:produtos_vendas(id)
        `)
        .gte('data_venda', `${data}T00:00:00`)
        .lte('data_venda', `${data}T23:59:59`);

      if (error) throw error;

      // Agrupar por atendente
      const rankingMap = new Map<string, RankingVendedor>();

      vendas?.forEach((venda: any) => {
        if (!isVendaValida(venda)) return;
        const atendenteNome = venda.atendente?.nome || 'Sem atendente';
        const fotoPerfil = venda.atendente?.foto_perfil_url || null;
        const quantidadeProdutos = venda.produtos?.length || 0;

        if (!rankingMap.has(atendenteNome)) {
          rankingMap.set(atendenteNome, {
            atendente_nome: atendenteNome,
            foto_perfil_url: fotoPerfil,
            quantidade_vendas: 0,
            quantidade_portas: 0,
            valor_total: 0
          });
        }

        const vendedor = rankingMap.get(atendenteNome)!;
        vendedor.quantidade_vendas += 1;
        vendedor.quantidade_portas += quantidadeProdutos;
        vendedor.valor_total += calcularFaturamentoLiquido(venda);
      });

      // Ordenar por valor total
      return Array.from(rankingMap.values()).sort((a, b) => b.valor_total - a.valor_total);
    },
    enabled: !!data,
    refetchInterval: 30000
  });
}
