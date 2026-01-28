-- Corrigir ordens de separação concluídas mas ainda marcadas como pausadas
UPDATE public.ordens_separacao 
SET pausada = false, pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;

-- Corrigir ordens de soldagem (preventivo)
UPDATE public.ordens_soldagem 
SET pausada = false, pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;

-- Corrigir ordens de perfiladeira (preventivo)
UPDATE public.ordens_perfiladeira 
SET pausada = false, pausada_em = NULL, justificativa_pausa = NULL, linha_problema_id = NULL
WHERE status = 'concluido' AND pausada = true;

-- Avançar o pedido #0081 para inspeção de qualidade
UPDATE public.pedidos_producao 
SET etapa_atual = 'inspecao_qualidade'
WHERE id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';