import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AutorizadoEtapa } from '@/utils/etapas';
import type { TipoParceiro } from '@/utils/parceiros';

export interface AutorizadoPerformance {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  estado: string | null;
  cidade: string | null;
  endereco: string | null;
  cep: string | null;
  logo_url: string | null;
  responsavel: string | null;
  etapa: AutorizadoEtapa;
  tipo_parceiro: TipoParceiro;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  vendedor_id: string | null;
  contrato_url: string | null;
  contrato_nome_arquivo: string | null;
  latitude: number | null;
  longitude: number | null;
  vendedor: {
    id: string;
    nome: string;
    foto_perfil_url: string | null;
  } | null;
}

export interface IndicadoresDesempenho {
  totalAtivos: number;
  totalPremium: number;
  totalPerdidos: number;
  distribuicaoPorAtendente: {
    atendente_id: string;
    atendente_nome: string;
    atendente_foto: string | null;
    count: number;
  }[];
}

export function useAutorizadosPerformance(tipoParceiro?: TipoParceiro) {
  return useQuery({
    queryKey: ["autorizados-performance", tipoParceiro],
    queryFn: async () => {
      let query = supabase
        .from("autorizados")
        .select(`
          *,
          vendedor:admin_users!vendedor_id(id, nome, foto_perfil_url)
        `)
        .eq("ativo", true);

      if (tipoParceiro) {
        query = query.eq("tipo_parceiro", tipoParceiro);
      }

      const { data: autorizados, error } = await query;

      if (error) throw error;

      return (autorizados || []) as AutorizadoPerformance[];
    }
  });
}

export function useIndicadoresDesempenho(tipoParceiro?: TipoParceiro) {
  const { data: autorizados = [] } = useAutorizadosPerformance(tipoParceiro);

  const filteredData = tipoParceiro
    ? autorizados.filter(a => a.tipo_parceiro === tipoParceiro)
    : autorizados;

  const totalAtivos = filteredData.filter(a => a.etapa === 'ativo').length;
  const totalPremium = filteredData.filter(a => a.etapa === 'premium').length;
  const totalPerdidos = filteredData.filter(a => a.etapa === 'perdido').length;

  // Distribuição por atendente
  const distribuicaoPorAtendente = filteredData.reduce((acc, autorizado) => {
    if (autorizado.vendedor) {
      const existing = acc.find(item => item.atendente_id === autorizado.vendedor!.id);
      if (existing) {
        existing.count++;
      } else {
        acc.push({
          atendente_id: autorizado.vendedor.id,
          atendente_nome: autorizado.vendedor.nome,
          atendente_foto: autorizado.vendedor.foto_perfil_url,
          count: 1
        });
      }
    }
    return acc;
  }, [] as IndicadoresDesempenho['distribuicaoPorAtendente']);

  const indicadores: IndicadoresDesempenho = {
    totalAtivos,
    totalPremium,
    totalPerdidos,
    distribuicaoPorAtendente: distribuicaoPorAtendente.sort((a, b) => b.count - a.count)
  };

  return indicadores;
}