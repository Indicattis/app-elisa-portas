
-- 1. Excluir linhas de ordens de qualidade
DELETE FROM linhas_ordens 
WHERE pedido_id IN ('60840c18-9164-493c-94db-a2970c4e6985', '1ed5836f-9448-4828-88b7-7f2aa8c74a71')
AND tipo_ordem = 'qualidade';

-- 2. Excluir ordens de qualidade
DELETE FROM ordens_qualidade 
WHERE pedido_id IN ('60840c18-9164-493c-94db-a2970c4e6985', '1ed5836f-9448-4828-88b7-7f2aa8c74a71');

-- 3. Fechar etapa de inspeção de qualidade (definir data_saida)
UPDATE pedidos_etapas 
SET data_saida = NOW() 
WHERE pedido_id IN ('60840c18-9164-493c-94db-a2970c4e6985', '1ed5836f-9448-4828-88b7-7f2aa8c74a71')
AND etapa = 'inspecao_qualidade'
AND data_saida IS NULL;

-- 4. Reabrir etapa "em_producao" (limpar data_saida)
UPDATE pedidos_etapas 
SET data_saida = NULL 
WHERE pedido_id IN ('60840c18-9164-493c-94db-a2970c4e6985', '1ed5836f-9448-4828-88b7-7f2aa8c74a71')
AND etapa = 'em_producao';

-- 5. Atualizar etapa atual dos pedidos para "em_producao"
UPDATE pedidos_producao 
SET etapa_atual = 'em_producao', updated_at = NOW()
WHERE id IN ('60840c18-9164-493c-94db-a2970c4e6985', '1ed5836f-9448-4828-88b7-7f2aa8c74a71');
