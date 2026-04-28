import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IBGEMunicipio {
  nome: string;
}

interface BrokenRow {
  id: string;
  estado: string;
  cidade: string;
}

interface UpdateResult {
  updated: number;
  deleted_duplicates: number;
  unresolved: Array<{ id: string; estado: string; cidade: string; reason: string; candidates?: string[] }>;
}

async function fetchMunicipios(uf: string): Promise<string[]> {
  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IBGE fetch failed for ${uf}: ${res.status}`);
  const data = (await res.json()) as IBGEMunicipio[];
  return data.map((m) => m.nome);
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build a regex from a broken name where each "�" matches exactly one character.
function buildPattern(broken: string): RegExp {
  const parts = broken.split("\uFFFD");
  const escaped = parts.map(escapeRegex).join(".");
  return new RegExp(`^${escaped}$`, "i");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Fetch all rows containing the replacement char
    const { data: brokenRows, error: fetchErr } = await supabase
      .from("frete_cidades")
      .select("id, estado, cidade")
      .like("cidade", "%\uFFFD%");

    if (fetchErr) throw fetchErr;

    const rows = (brokenRows ?? []) as BrokenRow[];
    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ updated: 0, deleted_duplicates: 0, unresolved: [], message: "Nenhuma cidade com encoding quebrado encontrada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Group by UF and fetch IBGE list per UF
    const ufs = Array.from(new Set(rows.map((r) => r.estado)));
    const ibgeByUf: Record<string, string[]> = {};
    for (const uf of ufs) {
      ibgeByUf[uf] = await fetchMunicipios(uf);
    }

    // 3. Pre-fetch existing (estado, cidade) pairs for collision detection
    const { data: allRows, error: allErr } = await supabase
      .from("frete_cidades")
      .select("estado, cidade");
    if (allErr) throw allErr;
    const existingPairs = new Set(
      (allRows ?? []).map((r: any) => `${r.estado}|${r.cidade.toLowerCase()}`),
    );

    const result: UpdateResult = { updated: 0, deleted_duplicates: 0, unresolved: [] };

    // 4. Resolve & update each broken row
    for (const row of rows) {
      const candidates = ibgeByUf[row.estado] ?? [];
      const pattern = buildPattern(row.cidade);
      const matches = candidates.filter((c) => pattern.test(c));

      if (matches.length === 0) {
        result.unresolved.push({
          id: row.id,
          estado: row.estado,
          cidade: row.cidade,
          reason: "no_match",
        });
        continue;
      }

      if (matches.length > 1) {
        result.unresolved.push({
          id: row.id,
          estado: row.estado,
          cidade: row.cidade,
          reason: "ambiguous",
          candidates: matches,
        });
        continue;
      }

      const correct = matches[0];
      const pairKey = `${row.estado}|${correct.toLowerCase()}`;

      // Collision: a correct row already exists -> delete the broken one
      if (existingPairs.has(pairKey)) {
        const { error: delErr } = await supabase
          .from("frete_cidades")
          .delete()
          .eq("id", row.id);
        if (delErr) {
          result.unresolved.push({
            id: row.id,
            estado: row.estado,
            cidade: row.cidade,
            reason: `delete_failed: ${delErr.message}`,
          });
        } else {
          result.deleted_duplicates++;
        }
        continue;
      }

      const { error: updErr } = await supabase
        .from("frete_cidades")
        .update({ cidade: correct })
        .eq("id", row.id);

      if (updErr) {
        result.unresolved.push({
          id: row.id,
          estado: row.estado,
          cidade: row.cidade,
          reason: `update_failed: ${updErr.message}`,
        });
      } else {
        existingPairs.add(pairKey);
        result.updated++;
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("corrigir-cidades-frete error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});