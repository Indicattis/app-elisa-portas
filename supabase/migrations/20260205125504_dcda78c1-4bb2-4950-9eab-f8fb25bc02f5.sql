-- Correção do Pedido 0081: Remover ordem duplicada e arquivar

-- 1. Deletar a ordem de qualidade duplicada criada por anomalia em 05/02
DELETE FROM ordens_qualidade 
WHERE id = '7c99ade7-5309-4acf-9db8-e7c3050ad19f';

-- 2. Atualizar o pedido para arquivo morto
UPDATE pedidos_producao
SET 
  etapa_atual = 'finalizado',
  arquivado = true,
  data_arquivamento = now(),
  arquivado_por = (SELECT user_id FROM admin_users WHERE email = 'admin@admin.com' LIMIT 1)
WHERE id = '1ed5836f-9448-4828-88b7-7f2aa8c74a71';