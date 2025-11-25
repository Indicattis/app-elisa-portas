-- Corrigir ordens de pintura concluídas que não foram marcadas como histórico
UPDATE ordens_pintura
SET historico = true
WHERE status = 'pronta' AND historico = false;