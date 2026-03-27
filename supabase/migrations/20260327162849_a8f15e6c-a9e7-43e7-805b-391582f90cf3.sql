-- Fix instalação do pedido 0205 - atribuir Equipe 2 e marcar como concluída
UPDATE instalacoes 
SET 
  responsavel_instalacao_id = 'dae6a19a-e9ba-4fa7-a464-af6f62025d2f',
  responsavel_instalacao_nome = 'Equipe 2',
  instalacao_concluida = true,
  instalacao_concluida_em = now()
WHERE id = 'e7e4630b-2dfe-4f42-ae13-58746e785f2d';