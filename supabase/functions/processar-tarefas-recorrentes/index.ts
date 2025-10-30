import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface TarefaTemplate {
  id: string;
  descricao: string;
  responsavel_id: string;
  setor: string | null;
  tipo_recorrencia: string;
  data_proxima_criacao: string;
  created_by: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const hoje = new Date().toISOString().split('T')[0];

    console.log(`[${hoje}] Iniciando processamento de tarefas recorrentes`);

    // Buscar templates que precisam criar tarefa hoje
    const { data: templates, error: templatesError } = await supabase
      .from('tarefas_templates')
      .select('*')
      .eq('ativa', true)
      .lte('data_proxima_criacao', hoje);

    if (templatesError) {
      console.error('Erro ao buscar templates:', templatesError);
      throw templatesError;
    }

    console.log(`Encontradas ${templates?.length || 0} tarefas para processar`);

    const resultados = [];

    for (const template of templates || []) {
      console.log(`Processando template ${template.id}: ${template.descricao}`);

      // Verificar se já existe tarefa criada para hoje
      const { data: tarefaExistente } = await supabase
        .from('tarefas')
        .select('id')
        .eq('template_id', template.id)
        .eq('data_referencia', hoje)
        .single();

      if (tarefaExistente) {
        console.log(`  ⚠️ Tarefa já criada hoje para template ${template.id}`);
        continue;
      }

      // Criar nova instância da tarefa
      const { data: novaTarefa, error: tarefaError } = await supabase
        .from('tarefas')
        .insert({
          descricao: template.descricao,
          responsavel_id: template.responsavel_id,
          setor: template.setor,
          status: 'em_andamento',
          recorrente: true,
          tipo_recorrencia: template.tipo_recorrencia,
          template_id: template.id,
          data_referencia: hoje,
          created_by: template.created_by
        })
        .select()
        .single();

      if (tarefaError) {
        console.error(`  ❌ Erro ao criar tarefa: ${tarefaError.message}`);
        continue;
      }

      console.log(`  ✅ Tarefa criada: ${novaTarefa.id}`);

      // Calcular próxima data de criação
      let proximaData = new Date(hoje);
      switch (template.tipo_recorrencia) {
        case 'todos_os_dias':
          proximaData.setDate(proximaData.getDate() + 1);
          break;
        case 'primeiro_dia_mes':
          proximaData.setMonth(proximaData.getMonth() + 1);
          proximaData.setDate(1);
          break;
        case 'cada_7_dias':
          proximaData.setDate(proximaData.getDate() + 7);
          break;
        case 'cada_15_dias':
          proximaData.setDate(proximaData.getDate() + 15);
          break;
        case 'cada_30_dias':
          proximaData.setDate(proximaData.getDate() + 30);
          break;
      }

      const proximaDataStr = proximaData.toISOString().split('T')[0];

      // Atualizar template com próxima data
      const { error: updateError } = await supabase
        .from('tarefas_templates')
        .update({ 
          data_proxima_criacao: proximaDataStr,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (updateError) {
        console.error(`  ❌ Erro ao atualizar template: ${updateError.message}`);
      } else {
        console.log(`  📅 Próxima criação: ${proximaDataStr}`);
      }

      resultados.push({
        template_id: template.id,
        descricao: template.descricao,
        tarefa_criada_id: novaTarefa.id,
        proxima_data: proximaDataStr
      });
    }

    console.log(`✅ Processamento concluído: ${resultados.length} tarefas criadas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processados: templates?.length || 0,
        criadas: resultados.length,
        resultados 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
