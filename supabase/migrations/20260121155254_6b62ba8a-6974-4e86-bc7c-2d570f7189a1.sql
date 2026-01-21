-- Sincronizar linhas de ordens já concluídas (corrige dados históricos inconsistentes)

-- Soldagem
UPDATE linhas_ordens lo
SET concluida = true, updated_at = NOW()
FROM ordens_soldagem os
WHERE lo.ordem_id = os.id 
  AND lo.tipo_ordem = 'soldagem'
  AND os.status = 'concluido'
  AND lo.concluida = false;

-- Perfiladeira
UPDATE linhas_ordens lo
SET concluida = true, updated_at = NOW()
FROM ordens_perfiladeira op
WHERE lo.ordem_id = op.id 
  AND lo.tipo_ordem = 'perfiladeira'
  AND op.status = 'concluido'
  AND lo.concluida = false;

-- Separação  
UPDATE linhas_ordens lo
SET concluida = true, updated_at = NOW()
FROM ordens_separacao os
WHERE lo.ordem_id = os.id 
  AND lo.tipo_ordem = 'separacao'
  AND os.status = 'concluido'
  AND lo.concluida = false;

-- Qualidade
UPDATE linhas_ordens lo
SET concluida = true, updated_at = NOW()
FROM ordens_qualidade oq
WHERE lo.ordem_id = oq.id 
  AND lo.tipo_ordem = 'qualidade'
  AND oq.status = 'concluido'
  AND lo.concluida = false;

-- Pintura
UPDATE linhas_ordens lo
SET concluida = true, updated_at = NOW()
FROM ordens_pintura op
WHERE lo.ordem_id = op.id 
  AND lo.tipo_ordem = 'pintura'
  AND op.status = 'concluido'
  AND lo.concluida = false;