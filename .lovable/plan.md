
# Plano: Corrigir Campo Inválido na Adição de Produtos do Catálogo

## Problema Identificado

O erro `PGRST204: Could not find the 'cor' column of 'produtos_vendas' in the schema cache` ocorre porque o modal `SelecionarAcessoriosModal.tsx` está enviando um campo `cor: ''` que não existe na tabela do banco de dados. A tabela possui `cor_id`, não `cor`.

---

## Causa Raiz

No arquivo `src/components/vendas/SelecionarAcessoriosModal.tsx`, a função `handleConfirmar` cria objetos com campos inválidos:

```typescript
// Linha ~91-106 - Campos problemáticos:
{
  cor: '',              // ❌ Não existe no banco - deveria ser cor_id
  tipo_instalacao: 'sem_instalacao',  // ❌ Possível campo inexistente
  custo_produto: 0,     // ❌ Possível campo inexistente
  custo_pintura: 0,     // ❌ Possível campo inexistente
}
```

---

## Solução

### Arquivo: `src/components/vendas/SelecionarAcessoriosModal.tsx`

**Remover campos que não existem na tabela `produtos_vendas`:**

| Campo atual | Ação |
|-------------|------|
| `cor: ''` | **REMOVER** |
| `tipo_instalacao: 'sem_instalacao'` | **REMOVER** (se não existir no banco) |
| `custo_produto: 0` | **REMOVER** (se não existir no banco) |
| `custo_pintura: 0` | **REMOVER** (se não existir no banco) |

**Código corrigido na função `handleConfirmar`:**

```typescript
const produtos: ProdutoVenda[] = itensSelecionadosArray.map(item => ({
  tipo_produto: item.tipo === 'acessorio' ? 'acessorio' : 'adicional',
  largura: 0,
  altura: 0,
  valor_produto: item.preco,
  valor_pintura: 0,
  valor_instalacao: 0,
  valor_frete: 0,
  quantidade: 1,
  descricao: item.nome,
  desconto_valor: 0,
  desconto_percentual: 0,
  tipo_desconto: 'valor' as 'valor' | 'percentual',
  vendas_catalogo_id: item.id
}));
```

---

## Arquivo Afetado

| Arquivo | Alteração |
|---------|-----------|
| `src/components/vendas/SelecionarAcessoriosModal.tsx` | Remover campos inexistentes (`cor`, `tipo_instalacao`, `custo_produto`, `custo_pintura`) |

---

## Resultado Esperado

Produtos do catálogo serão adicionados corretamente à venda sem erros de colunas inexistentes.
