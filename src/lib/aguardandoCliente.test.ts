import { describe, it, expect, vi } from "vitest";
import { enviarParaAguardandoCliente } from "./aguardandoCliente";

/**
 * Cria um mock do cliente Supabase que registra todas as chamadas
 * encadeadas em `calls`. Cada cadeia from(table).<op>(...).<eq>... resolve
 * em { error: null } por padrão, ou no erro definido em `errorOn`.
 */
function createSupabaseMock(opts: {
  errorOn?: { table: string; op: "update" | "upsert" | "insert" };
  authUserId?: string;
} = {}) {
  const calls: any[] = [];

  const makeChain = (table: string) => {
    const state: any = { table, op: null, payload: null, filters: [], options: null };

    const resolve = () => {
      calls.push(state);
      const err =
        opts.errorOn && opts.errorOn.table === state.table && opts.errorOn.op === state.op
          ? { message: `mocked-${state.op}-error-${state.table}` }
          : null;
      return Promise.resolve({ error: err, data: null });
    };

    const chain: any = {
      update: (payload: any) => {
        state.op = "update";
        state.payload = payload;
        return chain;
      },
      upsert: (payload: any, options?: any) => {
        state.op = "upsert";
        state.payload = payload;
        state.options = options;
        return chain;
      },
      insert: (payload: any) => {
        state.op = "insert";
        state.payload = payload;
        return resolve();
      },
      eq: (col: string, val: any) => {
        state.filters.push([col, val]);
        return chain;
      },
    };

    // Torna o chain "thenable" — await chain dispara resolve()
    Object.defineProperty(chain, "then", {
      configurable: true,
      get() {
        return (onFulfilled: any, onRejected: any) =>
          resolve().then(onFulfilled, onRejected);
      },
    });

    return chain;
  };

  const supabase: any = {
    from: (table: string) => makeChain(table),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: opts.authUserId ?? "user-123" } },
      }),
    },
  };

  return { supabase, calls };
}

describe("enviarParaAguardandoCliente", () => {
  const PEDIDO_ID = "pedido-1";
  const USER_ID = "user-123";
  const AGORA = "2026-04-23T18:00:00.000Z";

  it("executa as 4 operações na ordem correta", async () => {
    const { supabase, calls } = createSupabaseMock();

    await enviarParaAguardandoCliente(supabase, PEDIDO_ID, USER_ID, AGORA);

    expect(calls).toHaveLength(4);

    // 1) update etapa_atual
    expect(calls[0].table).toBe("pedidos_producao");
    expect(calls[0].op).toBe("update");
    expect(calls[0].payload).toEqual({ etapa_atual: "aguardando_cliente" });
    expect(calls[0].filters).toEqual([["id", PEDIDO_ID]]);

    // 2) update fechando finalizado (preserva data_entrada — só seta data_saida)
    expect(calls[1].table).toBe("pedidos_etapas");
    expect(calls[1].op).toBe("update");
    expect(calls[1].payload).toEqual({ data_saida: AGORA });
    expect(calls[1].payload).not.toHaveProperty("data_entrada");
    expect(calls[1].filters).toEqual([
      ["pedido_id", PEDIDO_ID],
      ["etapa", "finalizado"],
    ]);

    // 3) upsert criando aguardando_cliente
    expect(calls[2].table).toBe("pedidos_etapas");
    expect(calls[2].op).toBe("upsert");
    expect(calls[2].payload).toMatchObject({
      pedido_id: PEDIDO_ID,
      etapa: "aguardando_cliente",
      data_entrada: AGORA,
      data_saida: null,
    });
    expect(calls[2].options).toEqual({ onConflict: "pedido_id,etapa" });

    // 4) insert movimentação com teor permitido
    expect(calls[3].table).toBe("pedidos_movimentacoes");
    expect(calls[3].op).toBe("insert");
    expect(calls[3].payload).toMatchObject({
      pedido_id: PEDIDO_ID,
      etapa_origem: "finalizado",
      etapa_destino: "aguardando_cliente",
      teor: "avanco",
      user_id: USER_ID,
    });
  });

  it("propaga erro se update do pedido falhar", async () => {
    const { supabase } = createSupabaseMock({
      errorOn: { table: "pedidos_producao", op: "update" },
    });
    await expect(
      enviarParaAguardandoCliente(supabase, PEDIDO_ID, USER_ID, AGORA)
    ).rejects.toMatchObject({ message: expect.stringContaining("pedidos_producao") });
  });

  it("propaga erro se upsert da etapa aguardando_cliente falhar (regressão CHECK constraint)", async () => {
    const { supabase } = createSupabaseMock({
      errorOn: { table: "pedidos_etapas", op: "upsert" },
    });
    await expect(
      enviarParaAguardandoCliente(supabase, PEDIDO_ID, USER_ID, AGORA)
    ).rejects.toMatchObject({ message: expect.stringContaining("upsert") });
  });

  it("propaga erro se insert da movimentação falhar", async () => {
    const { supabase } = createSupabaseMock({
      errorOn: { table: "pedidos_movimentacoes", op: "insert" },
    });
    await expect(
      enviarParaAguardandoCliente(supabase, PEDIDO_ID, USER_ID, AGORA)
    ).rejects.toMatchObject({ message: expect.stringContaining("insert") });
  });
});