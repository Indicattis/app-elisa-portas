

# Tratar Contas a Receber sem Cliente

## Problema

Algumas contas a receber referenciam vendas que foram removidas do banco de dados. Como o nome do cliente vem da tabela `vendas`, essas contas aparecem com "—" na coluna Cliente.

## Solucao

1. **Melhorar o fallback na coluna Cliente**: Em vez de mostrar "—", exibir "Venda removida" com estilo visual diferenciado (texto em cor mais apagada e italico) para indicar claramente que se trata de um registro orfao.

2. **Incluir busca por "venda removida"**: Garantir que o filtro de busca por texto tambem funcione para encontrar esses registros ao digitar "venda removida".

### Arquivo editado
- `src/pages/administrativo/ContasReceberMinimalista.tsx` — alterar a celula da coluna Cliente para exibir "Venda removida" com estilo diferenciado quando `conta.venda?.cliente_nome` nao existir. Ajustar a logica de busca para considerar esse fallback.

