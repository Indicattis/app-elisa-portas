-- Corrigir dados históricos de pintura (multiplicar por 1000000 pois foram divididos por 1000 duas vezes indevidamente)
UPDATE pontuacao_colaboradores
SET metragem_quadrada_pintada = metragem_quadrada_pintada * 1000000
WHERE tipo_ranking = 'pintura'
  AND metragem_quadrada_pintada IS NOT NULL
  AND metragem_quadrada_pintada > 0;