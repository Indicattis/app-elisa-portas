import { supabase } from "@/integrations/supabase/client";
import type { CanalAquisicao } from "@/hooks/useCanaisAquisicao";

export interface CreateCanalAquisicaoData {
  nome: string;
  ordem?: number;
  ativo?: boolean;
}

export interface UpdateCanalAquisicaoData {
  nome?: string;
  ordem?: number;
  ativo?: boolean;
}

export class CanaisAquisicaoService {
  static async getAll() {
    const { data, error } = await supabase
      .from('canais_aquisicao')
      .select('*')
      .order('ordem');

    if (error) throw error;
    return data;
  }

  static async getActive() {
    const { data, error } = await supabase
      .from('canais_aquisicao')
      .select('*')
      .eq('ativo', true)
      .order('ordem');

    if (error) throw error;
    return data;
  }

  static async create(data: CreateCanalAquisicaoData) {
    const { data: canal, error } = await supabase
      .from('canais_aquisicao')
      .insert({
        ...data,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return canal;
  }

  static async update(id: string, data: UpdateCanalAquisicaoData) {
    const { data: canal, error } = await supabase
      .from('canais_aquisicao')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return canal;
  }

  static async delete(id: string) {
    // Verificar se há leads ou vendas usando este canal
    const { data: leads } = await supabase
      .from('elisaportas_leads')
      .select('id')
      .eq('canal_aquisicao_id', id)
      .limit(1);

    const { data: vendas } = await supabase
      .from('vendas')
      .select('id')
      .eq('canal_aquisicao_id', id)
      .limit(1);

    if (leads?.length || vendas?.length) {
      throw new Error('Não é possível excluir este canal pois há leads ou vendas associadas. Use a opção "Desativar" em vez de excluir.');
    }

    const { error } = await supabase
      .from('canais_aquisicao')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async reorder(items: { id: string; ordem: number }[]) {
    const updates = items.map(item => 
      supabase
        .from('canais_aquisicao')
        .update({ ordem: item.ordem })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      throw new Error('Erro ao reordenar canais');
    }
  }
}