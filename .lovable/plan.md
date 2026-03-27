

## Plano: Corrigir instalação do pedido 0205

### Problema
A instalação `e7e4630b-2dfe-4f42-ae13-58746e785f2d` do pedido 0205 está com:
- `instalacao_concluida = false`
- `responsavel_instalacao_id = NULL`

O pedido já está finalizado, mas a conclusão da instalação não foi registrada. Isso impede que a Equipe 2 receba crédito no ranking.

### Correção
Migration SQL para:
1. Atribuir `responsavel_instalacao_id = 'dae6a19a-e9ba-4fa7-a464-af6f62025d2f'` (Equipe 2) e `responsavel_instalacao_nome = 'Equipe 2'`
2. Marcar `instalacao_concluida = true` e `instalacao_concluida_em = now()`

### Arquivo
- 1 migration SQL (novo)

