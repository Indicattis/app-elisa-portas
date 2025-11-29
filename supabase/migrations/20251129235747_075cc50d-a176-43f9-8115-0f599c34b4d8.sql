-- Adicionar campo pago à tabela canais_aquisicao
ALTER TABLE canais_aquisicao 
ADD COLUMN pago boolean NOT NULL DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN canais_aquisicao.pago IS 'Indica se o canal é pago (ex: Google Ads, Meta Ads) ou orgânico';