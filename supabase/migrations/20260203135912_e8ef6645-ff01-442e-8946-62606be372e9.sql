-- Limpar flags de problema das linhas da ordem OPE-2026-0047
UPDATE linhas_ordens 
SET com_problema = false, problema_descricao = null, problema_reportado_em = null, problema_reportado_por = null
WHERE ordem_id = '6ff87734-c222-466f-8ec2-1b98554aa366';

-- Limpar estado de pausa da ordem
UPDATE ordens_perfiladeira 
SET pausada = false, pausada_em = null, justificativa_pausa = null, linha_problema_id = null
WHERE id = '6ff87734-c222-466f-8ec2-1b98554aa366';