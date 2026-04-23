import { supabase } from "@/integrations/supabase/client";
import { calcularTempoExpediente } from "@/utils/calcularTempoExpediente";

export type TipoOrdemProducao = 'soldagem' | 'perfiladeira' | 'separacao';

const TABELA_MAP: Record<TipoOrdemProducao, 'ordens_soldagem' | 'ordens_perfiladeira' | 'ordens_separacao'> = {
  soldagem: 'ordens_soldagem',
  perfiladeira: 'ordens_perfiladeira',
  separacao: 'ordens_separacao',
};

interface PausarParams {
  ordemId: string;
  tipoOrdem: TipoOrdemProducao;
  justificativa: string;
  linhasProblemaIds?: string[];
  comentarioPedido?: string;
}

export async function pausarOrdemProducao({
  ordemId,
  tipoOrdem,
  justificativa,
  linhasProblemaIds,
  comentarioPedido,
}: PausarParams) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const tabela = TABELA_MAP[tipoOrdem];
  if (!tabela) throw new Error('Tipo de ordem inválido');

  // Marcar linhas com problema
  if (linhasProblemaIds && linhasProblemaIds.length > 0) {
    const { error: linhasError } = await supabase
      .from('linhas_ordens')
      .update({
        com_problema: true,
        problema_reportado_em: new Date().toISOString(),
        problema_reportado_por: user.id,
      })
      .in('id', linhasProblemaIds);
    if (linhasError) throw linhasError;
  }

  // Buscar ordem
  const { data: ordem, error: ordemError } = await supabase
    .from(tabela)
    .select('capturada_em, tempo_acumulado_segundos, pedido_id')
    .eq('id', ordemId)
    .single();

  if (ordemError) throw ordemError;
  if (!ordem) throw new Error('Ordem não encontrada');

  let tempoSessao = 0;
  if ((ordem as any).capturada_em) {
    tempoSessao = calcularTempoExpediente(new Date((ordem as any).capturada_em), new Date());
  }
  const tempoTotal = ((ordem as any).tempo_acumulado_segundos || 0) + tempoSessao;

  const updateData: Record<string, any> = {
    pausada: true,
    pausada_em: new Date().toISOString(),
    justificativa_pausa: justificativa,
    tempo_acumulado_segundos: tempoTotal,
    responsavel_id: null,
    linha_problema_id: linhasProblemaIds?.[0] || null,
  };

  const { error } = await supabase
    .from(tabela)
    .update(updateData)
    .eq('id', ordemId);

  if (error) throw error;

  // Comentário no pedido (opcional)
  const comentarioTrim = comentarioPedido?.trim();
  const pedidoId = (ordem as any).pedido_id;
  if (comentarioTrim && pedidoId) {
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('nome')
      .eq('user_id', user.id)
      .maybeSingle();

    const autorNome = adminUser?.nome || user.email || 'Direção';

    const { error: comentarioError } = await supabase
      .from('pedido_comentarios')
      .insert({
        pedido_id: pedidoId,
        autor_id: user.id,
        autor_nome: autorNome,
        comentario: comentarioTrim,
      });

    if (comentarioError) throw comentarioError;
  }

  return ordemId;
}

interface DespausarParams {
  ordemId: string;
  tipoOrdem: TipoOrdemProducao;
}

export async function despausarOrdemProducao({ ordemId, tipoOrdem }: DespausarParams) {
  const tabela = TABELA_MAP[tipoOrdem];
  if (!tabela) throw new Error('Tipo de ordem inválido');

  const { error } = await supabase
    .from(tabela)
    .update({
      pausada: false,
      pausada_em: null,
      justificativa_pausa: null,
    } as any)
    .eq('id', ordemId);

  if (error) throw error;
  return ordemId;
}