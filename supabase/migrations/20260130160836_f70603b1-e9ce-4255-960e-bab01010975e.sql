-- Corrigir regra para porta GRANDE (> 6.5m): divisor = 5
UPDATE regras_etiquetas 
SET divisor = 5, updated_at = now()
WHERE id = '9a15ac7e-2f07-475d-9116-9930f370d3b3';

-- Corrigir regra para porta PEQUENA (< 6.5m): divisor = 10
UPDATE regras_etiquetas 
SET divisor = 10, updated_at = now()
WHERE id = '49178130-f516-42f5-b645-039fb2286f08';