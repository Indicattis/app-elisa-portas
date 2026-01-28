
# Plano: Corrigir Valores de Desconto Presencial

## Problema Identificado

Os valores de desconto presencial estão incorretos em vários lugares:

| Parâmetro | Valor Atual | Valor Correto |
|-----------|-------------|---------------|
| Desconto presencial | 3% | **5%** |
| Limite sem autorização | 6% (3+3) | **8%** (3+5) |
| Limite máximo com responsável | 11% (6+5) | **13%** (8+5) |

O erro está nos valores padrão/fallback definidos no código e possivelmente no registro do banco.

---

## Alterações Necessárias

### 1. Atualizar dados no banco de dados

Executar UPDATE no registro existente para corrigir o valor de `limite_desconto_presencial`:

```sql
UPDATE configuracoes_vendas
SET limite_desconto_presencial = 5
WHERE limite_desconto_presencial = 3;
```

### 2. Atualizar valores padrão no código

**Arquivo: `src/hooks/useConfiguracoesVendas.ts`**

Alterar os fallbacks de 3 para 5:

```typescript
// Antes
presencial: configuracoes?.limite_desconto_presencial ?? 3,
totalSemSenha: (...) + (configuracoes?.limite_desconto_presencial ?? 3),
totalComResponsavel: (...) + (configuracoes?.limite_desconto_presencial ?? 3) + ...

// Depois
presencial: configuracoes?.limite_desconto_presencial ?? 5,
totalSemSenha: (...) + (configuracoes?.limite_desconto_presencial ?? 5),
totalComResponsavel: (...) + (configuracoes?.limite_desconto_presencial ?? 5) + ...
```

**Arquivo: `src/utils/descontoVendasRules.ts`**

Alterar o fallback na função `calcularLimitesDesconto`:

```typescript
// Antes
const limitePresencialConfig = config?.presencial ?? 3;

// Depois
const limitePresencialConfig = config?.presencial ?? 5;
```

Também atualizar o comentário:

```typescript
// Antes
// 3% adicional para venda presencial

// Depois  
// 5% adicional para venda presencial
```

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| Banco de dados | UPDATE `limite_desconto_presencial = 5` |
| `src/hooks/useConfiguracoesVendas.ts` | Alterar fallback de 3 para 5 |
| `src/utils/descontoVendasRules.ts` | Alterar fallback de 3 para 5 |

---

## Resultado Final

| Parâmetro | Valor |
|-----------|-------|
| Pagamento à vista (não cartão) | +3% |
| Venda presencial | +5% |
| **Limite sem autorização** | **8%** |
| Com senha do responsável | +5% |
| **Limite máximo com responsável** | **13%** |
| Com senha master | Sem limite |
