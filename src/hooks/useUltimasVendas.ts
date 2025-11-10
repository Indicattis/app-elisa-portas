import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface UltimaVenda {
  id: string;
  cliente_nome: string;
  valor_venda: number;
  valor_frete: number;
  data_venda: string;
  canal_aquisicao_nome: string | null;
  canal_aquisicao_id: string | null;
  cac_canal: number | null;
}

export function useUltimasVendas() {
  return useQuery({
    queryKey: ['ultimas-vendas'],
    queryFn: async () => {
      // Buscar as 10 últimas vendas
      const { data: vendas, error: vendasError } = await supabase
        .from('vendas')
        .select(`
          id,
          cliente_nome,
          valor_venda,
          valor_frete,
          data_venda,
          canal_aquisicao_id,
          canais_aquisicao:canal_aquisicao_id (
            id,
            nome
          )
        `)
        .order('data_venda', { ascending: false })
        .limit(10);

      if (vendasError) throw vendasError;

      // Buscar investimentos do mês atual para calcular CAC
      const mesAtual = format(new Date(), "yyyy-MM") + "-01";
      const { data: investimentos, error: investimentosError } = await supabase
        .from('marketing_investimentos')
        .select('*')
        .eq('mes', mesAtual);

      if (investimentosError) throw investimentosError;

      // Calcular investimento total por tipo de canal
      const investimentoPorCanal: Record<string, number> = {};
      if (investimentos && investimentos.length > 0) {
        const totalGoogleAds = investimentos.reduce((sum, inv) => sum + Number(inv.investimento_google_ads || 0), 0);
        const totalMetaAds = investimentos.reduce((sum, inv) => sum + Number(inv.investimento_meta_ads || 0), 0);
        const totalLinkedinAds = investimentos.reduce((sum, inv) => sum + Number(inv.investimento_linkedin_ads || 0), 0);
        const totalOutros = investimentos.reduce((sum, inv) => sum + Number(inv.outros_investimentos || 0), 0);

        investimentoPorCanal['google'] = totalGoogleAds;
        investimentoPorCanal['meta'] = totalMetaAds;
        investimentoPorCanal['linkedin'] = totalLinkedinAds;
        investimentoPorCanal['outros'] = totalOutros;
      }

      // Buscar vendas do mês atual por canal para calcular CAC
      const inicioMes = startOfMonth(new Date()).toISOString();
      const fimMes = endOfMonth(new Date()).toISOString();
      
      const { data: vendasMes, error: vendasMesError } = await supabase
        .from('vendas')
        .select('canal_aquisicao_id, canais_aquisicao:canal_aquisicao_id(nome)')
        .gte('data_venda', inicioMes)
        .lte('data_venda', fimMes);

      if (vendasMesError) throw vendasMesError;

      // Contar vendas por canal no mês
      const vendasPorCanal: Record<string, number> = {};
      vendasMes?.forEach((venda: any) => {
        const canalNome = venda.canais_aquisicao?.nome?.toLowerCase() || 'outros';
        let chaveCanalInvestimento = 'outros';

        if (canalNome.includes('google')) {
          chaveCanalInvestimento = 'google';
        } else if (canalNome.includes('meta') || canalNome.includes('facebook') || canalNome.includes('instagram')) {
          chaveCanalInvestimento = 'meta';
        } else if (canalNome.includes('linkedin')) {
          chaveCanalInvestimento = 'linkedin';
        }

        vendasPorCanal[chaveCanalInvestimento] = (vendasPorCanal[chaveCanalInvestimento] || 0) + 1;
      });

      // Calcular CAC por tipo de canal
      const cacPorTipoCanal: Record<string, number> = {};
      Object.keys(investimentoPorCanal).forEach(tipoCanal => {
        const investimento = investimentoPorCanal[tipoCanal];
        const numVendas = vendasPorCanal[tipoCanal] || 0;
        if (investimento > 0 && numVendas > 0) {
          cacPorTipoCanal[tipoCanal] = investimento / numVendas;
        }
      });

      // Mapear CAC para as vendas
      const vendasComCAC: UltimaVenda[] = (vendas || []).map((venda: any) => {
        const canalNome = venda.canais_aquisicao?.nome?.toLowerCase() || 'outros';
        let chaveCanalInvestimento = 'outros';

        if (canalNome.includes('google')) {
          chaveCanalInvestimento = 'google';
        } else if (canalNome.includes('meta') || canalNome.includes('facebook') || canalNome.includes('instagram')) {
          chaveCanalInvestimento = 'meta';
        } else if (canalNome.includes('linkedin')) {
          chaveCanalInvestimento = 'linkedin';
        }

        return {
          id: venda.id,
          cliente_nome: venda.cliente_nome,
          valor_venda: venda.valor_venda,
          valor_frete: venda.valor_frete,
          data_venda: venda.data_venda,
          canal_aquisicao_nome: venda.canais_aquisicao?.nome || null,
          canal_aquisicao_id: venda.canal_aquisicao_id,
          cac_canal: cacPorTipoCanal[chaveCanalInvestimento] || null
        };
      });

      return vendasComCAC;
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });
}
