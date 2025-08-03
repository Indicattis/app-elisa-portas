-- Remover o canal "Outros" e garantir que todos os dados usem "Autorizado"
DELETE FROM public.canais_aquisicao WHERE nome = 'Outros';

-- Atualizar dados nas tabelas que ainda não foram migrados corretamente
-- Primeiro, vamos garantir que todos os leads tenham canal_aquisicao_id preenchido
UPDATE public.elisaportas_leads 
SET canal_aquisicao_id = (
  SELECT id FROM public.canais_aquisicao 
  WHERE nome = CASE 
    WHEN elisaportas_leads.canal_aquisicao IN ('Facebook', 'Instagram', 'Meta') THEN 'Meta (Facebook/Instagram)'
    WHEN elisaportas_leads.canal_aquisicao IN ('Outros', 'Autorizado') THEN 'Autorizado'
    WHEN elisaportas_leads.canal_aquisicao = 'Indicação' THEN 'Indicação'
    WHEN elisaportas_leads.canal_aquisicao = 'Google' THEN 'Google'
    WHEN elisaportas_leads.canal_aquisicao = 'LinkedIn' THEN 'LinkedIn'
    WHEN elisaportas_leads.canal_aquisicao = 'Cliente fidelizado' THEN 'Cliente fidelizado'
    ELSE 'Autorizado' -- Para qualquer outro valor não mapeado
  END
  LIMIT 1
)
WHERE canal_aquisicao_id IS NULL;

-- Atualizar dados na tabela vendas
UPDATE public.vendas 
SET canal_aquisicao_id = (
  SELECT id FROM public.canais_aquisicao 
  WHERE nome = CASE 
    WHEN vendas.canal_aquisicao IN ('Facebook', 'Instagram', 'Meta') THEN 'Meta (Facebook/Instagram)'
    WHEN vendas.canal_aquisicao IN ('Outros', 'Autorizado') THEN 'Autorizado'
    WHEN vendas.canal_aquisicao = 'Indicação' THEN 'Indicação'
    WHEN vendas.canal_aquisicao = 'Google' THEN 'Google'
    WHEN vendas.canal_aquisicao = 'LinkedIn' THEN 'LinkedIn'
    WHEN vendas.canal_aquisicao = 'Cliente fidelizado' THEN 'Cliente fidelizado'
    WHEN vendas.canal_aquisicao = 'WhatsApp' THEN 'Autorizado'
    WHEN vendas.canal_aquisicao = 'Site' THEN 'Autorizado'
    ELSE 'Autorizado' -- Para qualquer outro valor não mapeado
  END
  LIMIT 1
)
WHERE canal_aquisicao_id IS NULL;

-- Verificar se há dados não migrados e usar Autorizado como padrão
UPDATE public.elisaportas_leads 
SET canal_aquisicao_id = (SELECT id FROM public.canais_aquisicao WHERE nome = 'Autorizado' LIMIT 1)
WHERE canal_aquisicao_id IS NULL;

UPDATE public.vendas 
SET canal_aquisicao_id = (SELECT id FROM public.canais_aquisicao WHERE nome = 'Autorizado' LIMIT 1)
WHERE canal_aquisicao_id IS NULL;