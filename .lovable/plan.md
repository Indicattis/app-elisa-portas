

# Migrar Referências de Itens Duplicados no Estoque

## Resumo

Dois itens de eixo estao duplicados no estoque. Ambas as duplicatas possuem registros vinculados em 3 tabelas. A migracao vai transferir todas as referencias das duplicatas para os itens corretos e depois desativar as duplicatas.

## Dados identificados

| Duplicata | ID Duplicata | Item Correto | ID Correto |
|-----------|-------------|--------------|------------|
| Eixo - 4" 1/2 esp. 2,25 | 74e9ada9-5e1f-43fc-bb41-ac555a75642f | Eixo - 4" 1/2 (114mm) esp. 2,25mm | 0ea33d2c-054a-4205-96f2-0a18e658ef5e |
| Eixo - 6" 1/2 esp. 3,00 | ce0e7c6d-b1be-45b6-9513-ae39465ec750 | Eixo - 6" 1/2 (165mm) esp. 3,00mm | 9cacd94a-0601-4294-bee3-63222cfd5c3b |

## Referencias a migrar

Para cada duplicata, as seguintes tabelas serao atualizadas:

- **pedido_linhas** (coluna `estoque_id`): 68 + 17 = 85 registros
- **linhas_ordens** (coluna `estoque_id`): 131 + 32 = 163 registros
- **pontuacao_colaboradores** (coluna `estoque_id`): 34 + 10 = 44 registros

## Operacoes

A migracao sera feita via operacoes de UPDATE (usando a ferramenta de dados, nao migracao de schema):

1. Atualizar `pedido_linhas.estoque_id` das duplicatas para os IDs corretos
2. Atualizar `linhas_ordens.estoque_id` das duplicatas para os IDs corretos
3. Atualizar `pontuacao_colaboradores.estoque_id` das duplicatas para os IDs corretos
4. Desativar as duplicatas (`ativo = false`) na tabela `estoque`

## Seguranca

- Nenhuma exclusao permanente sera feita - as duplicatas serao apenas desativadas
- Os dados historicos serao preservados, apenas apontando para o item correto
- A quantidade em estoque das duplicatas nao sera somada ao item correto (se necessario, informar)

