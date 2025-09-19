import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AutorizadoEtapa } from '@/utils/etapas';

import type { TipoParceiro } from '@/utils/parceiros';

export interface AutorizadoPerformance {
  id: string;
  nome: string;
  etapa: AutorizadoEtapa;
  average_rating: number;
  total_ratings: number;
  ultima_avaliacao: string | null;
  dias_sem_avaliacao: number;
  tipo_parceiro?: TipoParceiro;
  status_risco: 'em_dia' | 'atencao' | 'critico';
  vendedor?: {
    nome: string;
    foto_perfil_url?: string;
  };
  ativo: boolean;
  inativado_automaticamente: boolean;
  data_inicio_contagem_inativacao?: string;
  // Propriedades adicionais para compatibilidade
  email?: string;
  telefone?: string;
  whatsapp?: string;
  responsavel?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  regiao?: string;
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  last_geocoded_at?: string;
  geocode_precision?: string;
  created_at: string;
  updated_at: string;
  vendedor_id?: string;
}

export interface IndicadoresDesempenho {
  naoAptos: number;
  zonaRisco: number;
  criticos: number;
  totalAtivos: number;
  ranking: Array<{ nome: string; rating: number; total_avaliacoes: number }>;
  distribuicaoPorAtendente: Array<{ nome: string; quantidade: number; foto?: string }>;
}

function calcularStatusRisco(diasSemAvaliacao: number): 'em_dia' | 'atencao' | 'critico' {
  if (diasSemAvaliacao >= 90) return 'critico';
  if (diasSemAvaliacao >= 60) return 'atencao';
  return 'em_dia';
}

export function useAutorizadosPerformance() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['autorizados-performance'],
    queryFn: async () => {
      const { data: autorizados, error } = await supabase
        .from('autorizados')
        .select(`
          *,
          vendedor:admin_users!vendedor_id(nome, foto_perfil_url)
        `)
        .order('nome');

      if (error) throw error;

      // Buscar as últimas avaliações de todos os autorizados
      const { data: ultimasAvaliacoes, error: avaliacoesError } = await supabase
        .from('autorizados_ratings')
        .select('autorizado_id, created_at')
        .order('created_at', { ascending: false });

      if (avaliacoesError) throw avaliacoesError;

      // Buscar ratings agregados manualmente
      const { data: allRatings, error: allRatingsError } = await supabase
        .from('autorizados_ratings')
        .select('autorizado_id, nota');

      if (allRatingsError) throw allRatingsError;

      // Calcular agregados manualmente
      const ratingsMap = new Map();
      (allRatings || []).forEach(rating => {
        if (!ratingsMap.has(rating.autorizado_id)) {
          ratingsMap.set(rating.autorizado_id, { notas: [], total: 0 });
        }
        ratingsMap.get(rating.autorizado_id).notas.push(rating.nota);
        ratingsMap.get(rating.autorizado_id).total++;
      });

      // Converter para o formato esperado
      const ratingsAgregados = Array.from(ratingsMap.entries()).map(([autorizado_id, data]) => ({
        autorizado_id,
        average_rating: data.notas.reduce((a, b) => a + b, 0) / data.notas.length,
        total_ratings: data.total
      }));

      // Criar mapa de últimas avaliações
      const ultimasAvaliacoesMap = new Map();
      ultimasAvaliacoes?.forEach(avaliacao => {
        if (!ultimasAvaliacoesMap.has(avaliacao.autorizado_id)) {
          ultimasAvaliacoesMap.set(avaliacao.autorizado_id, avaliacao.created_at);
        }
      });

      // Criar mapa de ratings
      const ratingsMapFinal = new Map();
      ratingsAgregados?.forEach(rating => {
        ratingsMapFinal.set(rating.autorizado_id, {
          average_rating: rating.average_rating || 0,
          total_ratings: rating.total_ratings || 0
        });
      });

      const hoje = new Date();
      
      // Helper function to map old etapa values to new ones
      const mapEtapaValue = (etapa: any): AutorizadoEtapa => {
        switch (etapa) {
          case 'integracao':
          case 'treinamento_comercial':
            return 'apresentacao_proposta';
          case 'treinamento_ficha_tecnica':
            return 'treinamento_ficha_tecnica';
          case 'treinamento_instalacao':
            return 'treinamento_instalacao';
          case 'apto':
            return 'apto';
          default:
            return 'apresentacao_proposta';
        }
      };
      
      const autorizadosComPerformance: AutorizadoPerformance[] = (autorizados || []).map(autorizado => {
        const ultimaAvaliacao = ultimasAvaliacoesMap.get(autorizado.id);
        
        // Usar data_inicio_contagem_inativacao como base para cálculo de dias
        let diasSemAvaliacao: number;
        if (autorizado.data_inicio_contagem_inativacao) {
          const dataInicio = new Date(autorizado.data_inicio_contagem_inativacao);
          diasSemAvaliacao = Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          // Fallback para a lógica antiga se não houver data_inicio_contagem_inativacao
          diasSemAvaliacao = ultimaAvaliacao 
            ? Math.floor((hoje.getTime() - new Date(ultimaAvaliacao).getTime()) / (1000 * 60 * 60 * 24))
            : 999; // Nunca avaliado
        }

        const ratings = ratingsMapFinal.get(autorizado.id) || { average_rating: 0, total_ratings: 0 };

        return {
          ...autorizado,
          etapa: mapEtapaValue(autorizado.etapa),
          average_rating: ratings.average_rating,
          total_ratings: ratings.total_ratings,
          ultima_avaliacao: ultimaAvaliacao,
          dias_sem_avaliacao: diasSemAvaliacao,
          status_risco: calcularStatusRisco(diasSemAvaliacao),
          inativado_automaticamente: autorizado.inativado_automaticamente || false,
          data_inicio_contagem_inativacao: autorizado.data_inicio_contagem_inativacao
        };
      });

      return autorizadosComPerformance;
    },
    retry: 1,
  });
}

export function useIndicadoresDesempenho(tipoParceiro?: TipoParceiro) {
  const { data: autorizados = [] } = useAutorizadosPerformance();

  // Filtrar por tipo de parceiro se especificado
  const autorizadosFiltrados = tipoParceiro 
    ? autorizados.filter(a => a.tipo_parceiro === tipoParceiro)
    : autorizados;

  return {
    naoAptos: autorizadosFiltrados.filter(a => a.ativo && a.etapa !== 'apto').length,
    zonaRisco: autorizadosFiltrados.filter(a => a.ativo && a.status_risco === 'atencao').length,
    criticos: autorizadosFiltrados.filter(a => a.ativo && a.status_risco === 'critico').length,
    totalAtivos: autorizadosFiltrados.filter(a => a.ativo).length,
    ranking: autorizadosFiltrados
      .filter(a => a.ativo && a.total_ratings > 0)
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 5)
      .map(a => ({
        nome: a.nome,
        rating: Number(a.average_rating.toFixed(1)),
        total_avaliacoes: a.total_ratings
      })),
    distribuicaoPorAtendente: autorizadosFiltrados
      .filter(a => a.ativo && a.vendedor)
      .reduce((acc, autorizado) => {
        const nome = autorizado.vendedor!.nome;
        const existing = acc.find(item => item.nome === nome);
        if (existing) {
          existing.quantidade++;
        } else {
          acc.push({
            nome,
            quantidade: 1,
            foto: autorizado.vendedor!.foto_perfil_url
          });
        }
        return acc;
      }, [] as Array<{ nome: string; quantidade: number; foto?: string }>)
      .sort((a, b) => b.quantidade - a.quantidade)
  };
}

export async function executarInativacaoAutomatica(): Promise<{ inativados: number; autorizados: string[] }> {
  try {
    // Buscar autorizados ativos que não foram inativados automaticamente
    const { data: autorizados, error } = await supabase
      .from('autorizados')
      .select('id, nome, data_inicio_contagem_inativacao')
      .eq('ativo', true)
      .eq('inativado_automaticamente', false);

    if (error) throw error;

    if (!autorizados || autorizados.length === 0) {
      return { inativados: 0, autorizados: [] };
    }

    const hoje = new Date();
    const autorizadosParaInativar = autorizados.filter(autorizado => {
      // Usar data_inicio_contagem_inativacao como referência
      if (!autorizado.data_inicio_contagem_inativacao) {
        return false; // Não inativar se não houver data de início da contagem
      }
      
      const dataInicio = new Date(autorizado.data_inicio_contagem_inativacao);
      const diasSemAvaliacao = Math.floor(
        (hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return diasSemAvaliacao >= 90;
    });

    if (autorizadosParaInativar.length === 0) {
      return { inativados: 0, autorizados: [] };
    }

    // Inativar em lote
    const { error: inativacaoError } = await supabase
      .from('autorizados')
      .update({
        ativo: false,
        inativado_automaticamente: true,
        data_inativacao_automatica: new Date().toISOString()
      })
      .in('id', autorizadosParaInativar.map(a => a.id));

    if (inativacaoError) throw inativacaoError;

    // Registrar logs de inativação
    const logs = autorizadosParaInativar.map(autorizado => {
      const dataInicio = new Date(autorizado.data_inicio_contagem_inativacao!);
      const diasSemAvaliacao = Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));

      return {
        autorizado_id: autorizado.id,
        dias_sem_avaliacao: diasSemAvaliacao,
        ultima_avaliacao_data: autorizado.data_inicio_contagem_inativacao
      };
    });

    const { error: logError } = await supabase
      .from('inativacoes_automaticas_log')
      .insert(logs);

    if (logError) throw logError;

    return {
      inativados: autorizadosParaInativar.length,
      autorizados: autorizadosParaInativar.map(a => a.nome)
    };

  } catch (error) {
    console.error('Erro ao executar inativação automática:', error);
    throw error;
  }
}