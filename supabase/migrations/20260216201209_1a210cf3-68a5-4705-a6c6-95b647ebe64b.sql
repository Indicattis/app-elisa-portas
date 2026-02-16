UPDATE linhas_ordens 
SET concluida = true, concluida_em = NOW()
WHERE pedido_id = '9a381362-65f2-41cc-99bd-b5be2b724e61'
  AND tipo_ordem IN ('soldagem', 'separacao')
  AND concluida = false;