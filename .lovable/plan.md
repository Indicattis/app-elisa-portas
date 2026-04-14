

## Plano: Atualizar quantidade da porta 9.60 × 6.60m para 2

### Correção de dados
Atualizar o registro `01bf7338-c52e-45a7-bec7-9180a8800395` (porta 9.60 × 6.60m) de `quantidade: 1` para `quantidade: 2`.

Também corrigir a porta 4.24 × 3.90m conforme solicitado anteriormente: atualizar `94973500` para `quantidade: 2` e deletar o duplicado `663a1699`.

### Resultado final
| Porta | Dimensões | Quantidade |
|-------|-----------|------------|
| 1 | 9.60 × 6.60m | 2 |
| 2 | 4.24 × 3.90m | 2 |
| 3 | 3.00 × 3.45m | 1 |

Total: 5 portas físicas.

### Ações
1. `UPDATE produtos_vendas SET quantidade = 2 WHERE id = '01bf7338-...'`
2. `UPDATE produtos_vendas SET quantidade = 2 WHERE id = '94973500-...'`
3. `DELETE FROM produtos_vendas WHERE id = '663a1699-...'`

