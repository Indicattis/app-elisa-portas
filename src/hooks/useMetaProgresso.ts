import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MetaColaborador } from "@/hooks/useMetasColaboradorIndividual";

export type TipoOrdemMeta = 'soldagem' | 'perfiladeira' | 'separacao' | 'qualidade' | 'pintura' | 'carregamento';

export interface MetaProgressoInfo {
  meta: MetaColaborador;
  progressoAtual: number;
  porcentagem: number;
}

const mapTipoOrdemToMeta = (tipoOrdem: TipoOrdemMeta): MetaColaborador["tipo_meta"] => {
  switch (tipoOrdem) {
    case 'soldagem': return 'solda';
    case 'perfiladeira': return 'perfiladeira';
    case 'separacao': return 'separacao';
    case 'qualidade': return 'qualidade';
    case 'pintura': return 'pintura';
    case 'carregamento': return 'carregamento';
  }
};

const getUnidadeMeta = (tipo: MetaColaborador["tipo_meta"]): string => {
  switch (tipo) {
    case 'solda': return 'portas';
    case 'perfiladeira': return 'metros';
    case 'separacao': return 'itens';
    case 'qualidade': return 'pedidos';
    case 'pintura': return 'm²';
    case 'carregamento': return 'pedidos';
  }
};

const getCorMeta = (tipo: MetaColaborador["tipo_meta"]): string => {
  switch (tipo) {
    case 'solda': return 'bg-orange-500';
    case 'perfiladeira': return 'bg-blue-500';
    case 'separacao': return 'bg-purple-500';
    case 'qualidade': return 'bg-green-500';
    case 'pintura': return 'bg-pink-500';
    case 'carregamento': return 'bg-amber-500';
  }
};

async function buscarMetaAtiva(userId: string, tipoMeta: MetaColaborador["tipo_meta"]): Promise<MetaColaborador | null> {
  const hoje = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("metas_colaboradores")
    .select("*")
    .eq("user_id", userId)
    .eq("tipo_meta", tipoMeta)
    .eq("concluida", false)
    .lte("data_inicio", hoje)
    .gte("data_termino", hoje)
    .order("data_termino", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as MetaColaborador;
}

async function calcularProgresso(
  userId: string, 
  tipoOrdem: TipoOrdemMeta, 
  meta: MetaColaborador
): Promise<number> {
  const { data_inicio, data_termino } = meta;

  switch (tipoOrdem) {
    case 'perfiladeira': {
      const { data } = await supabase
        .from("pontuacao_colaboradores")
        .select("metragem_linear")
        .eq("user_id", userId)
        .eq("tipo_ranking", "perfiladeira")
        .gte("created_at", data_inicio)
        .lte("created_at", data_termino + "T23:59:59");
      return (data || []).reduce((acc, item) => acc + (Number((item as any).metragem_linear) || 0), 0);
    }
    case 'soldagem': {
      const { data } = await supabase
        .from("pontuacao_colaboradores")
        .select("porta_soldada")
        .eq("user_id", userId)
        .eq("tipo_ranking", "solda")
        .not("porta_soldada", "is", null)
        .gte("created_at", data_inicio)
        .lte("created_at", data_termino + "T23:59:59");
      return (data || []).length;
    }
    case 'separacao': {
      const { data } = await supabase
        .from("pontuacao_colaboradores")
        .select("pedido_separado")
        .eq("user_id", userId)
        .eq("tipo_ranking", "separacao")
        .not("pedido_separado", "is", null)
        .gte("created_at", data_inicio)
        .lte("created_at", data_termino + "T23:59:59");
      return (data || []).reduce((acc, item) => acc + (Number((item as any).pedido_separado) || 0), 0);
    }
    case 'pintura': {
      const { data } = await supabase
        .from("pontuacao_colaboradores")
        .select("metragem_quadrada_pintada")
        .eq("user_id", userId)
        .eq("tipo_ranking", "pintura")
        .gte("created_at", data_inicio)
        .lte("created_at", data_termino + "T23:59:59");
      return (data || []).reduce((acc, item) => acc + (Number((item as any).metragem_quadrada_pintada) || 0), 0);
    }
    case 'qualidade': {
      const { data } = await supabase
        .from("ordens_qualidade")
        .select("id")
        .eq("responsavel_id", userId)
        .eq("status", "concluido")
        .gte("data_conclusao", data_inicio)
        .lte("data_conclusao", data_termino + "T23:59:59");
      return data?.length || 0;
    }
    case 'carregamento': {
      try {
        const { data } = await supabase
          .from("instalacoes")
          .select("id")
          .eq("responsavel_carregamento_id", userId)
          .eq("carregamento_concluido", true)
          .gte("data_carregamento", data_inicio)
          .lte("data_carregamento", data_termino + "T23:59:59");
        return data?.length || 0;
      } catch {
        return 0;
      }
    }
    default:
      return 0;
  }
}

export function useMetaProgresso() {
  const [metaInfo, setMetaInfo] = useState<MetaProgressoInfo | null>(null);
  const [visible, setVisible] = useState(false);

  const mostrarProgresso = useCallback(async (userId: string, tipoOrdem: TipoOrdemMeta) => {
    try {
      const tipoMeta = mapTipoOrdemToMeta(tipoOrdem);
      const meta = await buscarMetaAtiva(userId, tipoMeta);
      
      if (!meta) return;

      const progressoAtual = await calcularProgresso(userId, tipoOrdem, meta);
      const porcentagem = Math.min((progressoAtual / meta.valor_meta) * 100, 100);

      setMetaInfo({ meta, progressoAtual, porcentagem });
      setVisible(true);

      setTimeout(() => setVisible(false), 5000);
    } catch (error) {
      console.error("Erro ao buscar progresso da meta:", error);
    }
  }, []);

  const fechar = useCallback(() => {
    setVisible(false);
  }, []);

  return { 
    metaInfo, 
    visible, 
    mostrarProgresso, 
    fechar,
    getUnidadeMeta,
    getCorMeta,
  };
}
