
# Correção: Modal de Faturamento - Validação de Lucro

## Problema Identificado

No modal `LucroItemModal.tsx`, a validação `lucro > produto.valor_total || lucro < 0` está falhando, provavelmente por:

1. **Inicialização incorreta**: O estado `lucro` pode estar como `NaN` se houver problemas de parsing
2. **Dependência incompleta no useEffect**: Não re-inicializa corretamente quando o produto muda
3. **Falta de tratamento para valores undefined/null**

## Diagnóstico

- Os produtos no banco têm `valor_total: 600, 900, 705` (corretos)
- A validação linha 45: `lucro > produto.valor_total || lucro < 0`
- Se `lucro` for `NaN` ou `valor_total` for `undefined`, a comparação pode ter comportamentos inesperados

## Solução

### Arquivo: `src/components/vendas/LucroItemModal.tsx`

**1. Corrigir inicialização e dependências (linhas 35-45):**

```typescript
// ANTES:
const [lucro, setLucro] = useState<number>(0);

useEffect(() => {
  if (isOpen) {
    setLucro(produto.lucro_item || 0);
  }
}, [isOpen, produto.lucro_item]);

const custoCalculado = produto.valor_total - lucro;
const margem = produto.valor_total > 0 ? (lucro / produto.valor_total) * 100 : 0;
const isLucroInvalido = lucro > produto.valor_total || lucro < 0;

// DEPOIS:
const [lucro, setLucro] = useState<number>(0);

// Usar produto.id como dependência para garantir reset quando trocar de produto
useEffect(() => {
  if (isOpen && produto) {
    setLucro(produto.lucro_item ?? 0);
  }
}, [isOpen, produto?.id, produto?.lucro_item]);

// Garantir valores numéricos válidos
const valorTotal = Number(produto.valor_total) || 0;
const lucroValido = Number.isFinite(lucro) ? lucro : 0;

const custoCalculado = valorTotal - lucroValido;
const margem = valorTotal > 0 ? (lucroValido / valorTotal) * 100 : 0;
const isLucroInvalido = lucroValido > valorTotal || lucroValido < 0;
```

**2. Corrigir handler de onChange (linha 79):**

```typescript
// ANTES:
onChange={(e) => setLucro(Number(e.target.value))}

// DEPOIS:
onChange={(e) => {
  const valor = parseFloat(e.target.value);
  setLucro(Number.isFinite(valor) ? valor : 0);
}}
```

**3. Atualizar exibição de valores (linhas 93-108):**

```typescript
// ANTES:
R$ {produto.valor_total.toFixed(2)}
R$ {lucro.toFixed(2)}
R$ {custoCalculado.toFixed(2)}

// DEPOIS:
R$ {valorTotal.toFixed(2)}
R$ {lucroValido.toFixed(2)}
R$ {custoCalculado.toFixed(2)}
```

## Alterações Resumidas

| Local | Problema | Correção |
|-------|----------|----------|
| useState/useEffect | Dependência incompleta | Adicionar `produto.id` nas dependências |
| Validação | Pode comparar com NaN/undefined | Normalizar valores com `Number.isFinite()` |
| onChange | `Number()` retorna NaN para strings inválidas | Usar `parseFloat` + validação |
| Exibição | Pode dar erro se valores undefined | Usar variáveis normalizadas |

## Resultado Esperado

O modal abrirá corretamente, permitindo ao usuário inserir valores de lucro entre R$ 0,00 e o valor total do produto, sem mensagens de erro falsas.
