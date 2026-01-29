
# Plano: Adicionar Descontos e Acréscimos em /direcao/vendas/:id

## Problema Identificado

A página `VendaDetalhesDirecao.tsx` não exibe as informações de:
1. **Descontos aplicados** - dados vindos de `vendas_autorizacoes_desconto`
2. **Acréscimos/Crédito** - campo `valor_credito` da tabela `vendas`

A query atual apenas busca:
```typescript
.select(`
  *,
  produtos:produtos_vendas(...)
`)
```

---

## Solução

### 1. Atualizar a Query para Buscar os Dados

Modificar `fetchVendaDetails()` para incluir:
- Campo `valor_credito` (já vem com `*`, mas precisa verificar)
- Relação `autorizacao_desconto:vendas_autorizacoes_desconto` com dados do autorizador
- Campo `desconto_valor` de cada produto

```typescript
const { data: vendaData, error: vendaError } = await supabase
  .from("vendas")
  .select(`
    *,
    produtos:produtos_vendas(
      id,
      tipo_produto,
      largura,
      altura,
      quantidade,
      valor_produto,
      valor_total,
      desconto_percentual,
      desconto_valor,
      catalogo_cores(nome, codigo_hex)
    ),
    autorizacao_desconto:vendas_autorizacoes_desconto(
      id,
      percentual_desconto,
      tipo_autorizacao,
      autorizador:admin_users!vendas_autorizacoes_desconto_autorizado_por_fkey(
        nome,
        foto_perfil_url
      )
    )
  `)
  .eq("id", id)
  .single();
```

### 2. Adicionar Interfaces para Tipagem

```typescript
interface AutorizacaoDesconto {
  id: string;
  percentual_desconto: number;
  tipo_autorizacao: string;
  autorizador: {
    nome: string;
    foto_perfil_url: string | null;
  } | null;
}
```

### 3. Adicionar Seção Visual de Descontos e Acréscimos

Entre os cards financeiros e a lista de produtos, adicionar uma nova seção similar à página de faturamento:

```text
+------------------------------------------------------------------+
| DESCONTOS E ACRÉSCIMOS                                           |
| +-------------------------+ +---------------------------+        |
| | ↓ DESCONTOS             | | ↑ ACRÉSCIMOS             |        |
| | -R$ XXX,XX              | | +R$ XXX,XX               |        |
| | XX% - Senha Master      | | Crédito do cliente       |        |
| | Autorizado: João        | |                          |        |
| +-------------------------+ +---------------------------+        |
+------------------------------------------------------------------+
```

### 4. Atualizar o Valor Total Exibido

O card "Valor Total" deve considerar o crédito:
```typescript
// Antes
{formatCurrency(venda.valor_venda)}

// Depois
{formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}
```

---

## Cálculos Necessários

```typescript
// Total de descontos (soma dos descontos de cada produto)
const totalDescontos = venda.produtos?.reduce(
  (acc, p) => acc + (p.desconto_valor || 0), 
  0
) || 0;

// Total de acréscimos
const totalAcrescimos = venda.valor_credito || 0;

// Autorização (primeira do array)
const autorizacao = venda.autorizacao_desconto?.[0];
```

---

## Componente da Seção

A seção será renderizada apenas quando houver descontos ou acréscimos:

```typescript
{(totalDescontos > 0 || totalAcrescimos > 0) && (
  <div className={cardClass}>
    <h3 className="text-white font-medium mb-4">Descontos e Acréscimos</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card de Descontos */}
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <ArrowDown className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-400">Descontos</span>
        </div>
        <p className="text-2xl font-bold text-red-400">
          -{formatCurrency(totalDescontos)}
        </p>
        {autorizacao && (
          <div className="mt-3 pt-3 border-t border-red-500/20 space-y-1">
            <p className="text-xs text-white/50">
              Percentual: {autorizacao.percentual_desconto.toFixed(2)}%
            </p>
            <p className="text-xs text-white/50">
              Tipo: {autorizacao.tipo_autorizacao === 'master' 
                ? 'Senha Master' : 'Responsável do Setor'}
            </p>
            <p className="text-xs text-white/50">
              Autorizado por: {autorizacao.autorizador?.nome || 'Não informado'}
            </p>
          </div>
        )}
      </div>
      
      {/* Card de Acréscimos */}
      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-2 mb-2">
          <ArrowUp className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">Acréscimos</span>
        </div>
        <p className="text-2xl font-bold text-emerald-400">
          +{formatCurrency(totalAcrescimos)}
        </p>
        {totalAcrescimos > 0 && (
          <p className="mt-2 text-xs text-white/50">Crédito do cliente</p>
        )}
      </div>
    </div>
  </div>
)}
```

---

## Resumo de Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/direcao/VendaDetalhesDirecao.tsx` | Atualizar query, adicionar interfaces, adicionar seção visual |

---

## Imports Necessários

```typescript
import { ArrowDown, ArrowUp } from "lucide-react";
```

---

## Resultado Visual

Ao acessar `/direcao/vendas/:id`:

1. Os 4 cards financeiros superiores (Valor Total agora com crédito somado)
2. **Nova seção**: "Descontos e Acréscimos" com dois cards lado a lado
   - Descontos em vermelho com detalhes da autorização
   - Acréscimos em verde mostrando o crédito
3. Lista de produtos
4. Informações do cliente e da venda
