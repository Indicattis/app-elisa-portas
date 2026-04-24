import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[processar-postagens-agendadas] Iniciando processamento...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chamar a função do banco para processar postagens agendadas
    const { data, error } = await supabase.rpc("processar_postagens_agendadas");

    if (error) {
      console.error("[processar-postagens-agendadas] Erro ao processar:", error);
      throw error;
    }

    const postagensAtualizadas = data || 0;
    console.log(`[processar-postagens-agendadas] ${postagensAtualizadas} postagens marcadas como postadas`);

    return new Response(
      JSON.stringify({
        success: true,
        postagens_atualizadas: postagensAtualizadas,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[processar-postagens-agendadas] Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : String(error)),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
