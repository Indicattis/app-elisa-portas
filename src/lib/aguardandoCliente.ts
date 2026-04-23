import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Move um pedido de "Finalizado" para "Aguardando Cliente":
 * 1. Atualiza pedidos_producao.etapa_atual
 * 2. Fecha a linha "finalizado" em pedidos_etapas (preserva data_entrada original)
 * 3. Cria/abre a linha "aguardando_cliente"
 * 4. Registra movimentação
 *
 * Lança erro se qualquer passo falhar.
 */
export async function enviarParaAguardandoCliente(
  supabase: SupabaseClient<any>,
  pedidoId: string,
  userId: string,
  agora: string = new Date().toISOString()
) {
  const { error: errUpdate } = await supabase
    .from("pedidos_producao")
    .update({ etapa_atual: "aguardando_cliente" })
    .eq("id", pedidoId);
  if (errUpdate) throw errUpdate;

  const { error: errCloseFinalizado } = await supabase
    .from("pedidos_etapas")
    .update({ data_saida: agora })
    .eq("pedido_id", pedidoId)
    .eq("etapa", "finalizado");
  if (errCloseFinalizado) throw errCloseFinalizado;

  const { error: errCreateAguardando } = await supabase
    .from("pedidos_etapas")
    .upsert(
      {
        pedido_id: pedidoId,
        etapa: "aguardando_cliente",
        data_entrada: agora,
        data_saida: null,
        checkboxes: [],
      },
      { onConflict: "pedido_id,etapa" }
    );
  if (errCreateAguardando) throw errCreateAguardando;

  const { error: errMov } = await supabase.from("pedidos_movimentacoes").insert({
    pedido_id: pedidoId,
    etapa_origem: "finalizado",
    etapa_destino: "aguardando_cliente",
    teor: "avanco",
    user_id: userId,
    descricao: "Pedido enviado para Aguardando Cliente",
  });
  if (errMov) throw errMov;
}