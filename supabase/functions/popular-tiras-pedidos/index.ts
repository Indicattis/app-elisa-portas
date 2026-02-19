import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Iniciando processamento de tiras para pedidos existentes...');

    // Buscar todos os pedidos que têm vendas com portas de enrolar
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos_producao')
      .select(`
        id,
        venda_id
      `);

    if (pedidosError) throw pedidosError;

    console.log(`Encontrados ${pedidos?.length || 0} pedidos para verificar`);

    let pedidosProcessados = 0;
    let linhasAdicionadas = 0;

    for (const pedido of pedidos || []) {
      try {
        // Buscar portas de enrolar da venda
        const { data: portas, error: portasError } = await supabase
          .from('produtos_vendas')
          .select('*')
          .eq('venda_id', pedido.venda_id)
          .eq('tipo_produto', 'porta_enrolar');

        if (portasError) {
          console.error(`Erro ao buscar portas do pedido ${pedido.id}:`, portasError);
          continue;
        }

        const portasValidas = portas?.filter(p => p.largura && p.altura) || [];
        
        if (portasValidas.length === 0) {
          console.log(`Pedido ${pedido.id} não tem portas de enrolar com dimensões`);
          continue;
        }

        // Verificar se já tem tiras
        const { data: existingTiras } = await supabase
          .from('pedido_linhas')
          .select('id')
          .eq('pedido_id', pedido.id)
          .eq('categoria_linha', 'perfiladeira')
          .in('estoque_id', [
            'd9d2982d-1323-4f04-9783-7bd3e7eca88c',
            'cf683858-1a61-46af-8566-28174a8b3683'
          ]);

        if (existingTiras && existingTiras.length > 0) {
          console.log(`Pedido ${pedido.id} já tem tiras, pulando...`);
          continue;
        }

        // Buscar próxima ordem
        const { data: linhasExistentes } = await supabase
          .from('pedido_linhas')
          .select('ordem')
          .eq('pedido_id', pedido.id)
          .order('ordem', { ascending: false })
          .limit(1);

        let ordemAtual = linhasExistentes && linhasExistentes.length > 0 
          ? linhasExistentes[0].ordem + 1 
          : 1;

        // Buscar info dos produtos
        const { data: produtosTiras } = await supabase
          .from('estoque')
          .select('*')
          .in('id', [
            'd9d2982d-1323-4f04-9783-7bd3e7eca88c',
            'cf683858-1a61-46af-8566-28174a8b3683'
          ]);

        const meiaCanalisaInfo = produtosTiras?.find(p => p.id === 'd9d2982d-1323-4f04-9783-7bd3e7eca88c');
        const meiaCanaicroInfo = produtosTiras?.find(p => p.id === 'cf683858-1a61-46af-8566-28174a8b3683');

        if (!meiaCanalisaInfo || !meiaCanaicroInfo) {
          console.error('Produtos de tiras não encontrados no estoque');
          continue;
        }

        const linhasParaInserir: any[] = [];

        portasValidas.forEach((porta: any) => {
          const larguraPorta = porta.largura;
          const alturaPorta = porta.altura;
          const qtdMeiaCanas = Math.ceil(alturaPorta / 0.076);

          // 3 linhas por porta
          linhasParaInserir.push(
            {
              pedido_id: pedido.id,
              estoque_id: meiaCanalisaInfo.id,
              nome_produto: meiaCanalisaInfo.nome_produto,
              descricao_produto: meiaCanalisaInfo.descricao_produto,
              largura: parseFloat((larguraPorta - 0.14).toFixed(2)),
              altura: null,
              quantidade: qtdMeiaCanas,
              categoria_linha: 'perfiladeira',
              ordem: ordemAtual++,
            },
            {
              pedido_id: pedido.id,
              estoque_id: meiaCanalisaInfo.id,
              nome_produto: meiaCanalisaInfo.nome_produto,
              descricao_produto: meiaCanalisaInfo.descricao_produto,
              largura: parseFloat((larguraPorta + 0.1).toFixed(2)),
              altura: null,
              quantidade: 6,
              categoria_linha: 'perfiladeira',
              ordem: ordemAtual++,
            },
            {
              pedido_id: pedido.id,
              estoque_id: meiaCanaicroInfo.id,
              nome_produto: meiaCanaicroInfo.nome_produto,
              descricao_produto: meiaCanaicroInfo.descricao_produto,
              largura: parseFloat((larguraPorta - 0.14).toFixed(2)),
              altura: null,
              quantidade: 4,
              categoria_linha: 'perfiladeira',
              ordem: ordemAtual++,
            }
          );
        });

        if (linhasParaInserir.length > 0) {
          const { error: insertError } = await supabase
            .from('pedido_linhas')
            .insert(linhasParaInserir);

          if (!insertError) {
            pedidosProcessados++;
            linhasAdicionadas += linhasParaInserir.length;
            console.log(`Pedido ${pedido.id}: ${linhasParaInserir.length} linhas adicionadas`);
          } else {
            console.error(`Erro ao inserir linhas no pedido ${pedido.id}:`, insertError);
          }
        }
      } catch (error: any) {
        console.error(`Erro ao processar pedido ${pedido.id}:`, error);
        continue;
      }
    }

    console.log(`Processamento concluído: ${pedidosProcessados} pedidos, ${linhasAdicionadas} linhas`);

    return new Response(
      JSON.stringify({
        success: true,
        pedidosProcessados,
        linhasAdicionadas,
        message: `Processados ${pedidosProcessados} pedidos com ${linhasAdicionadas} linhas adicionadas`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
