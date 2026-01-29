
# Plano: Unidade de Medida no Catálogo e Quantidade Decimal nas Vendas

## Resumo

Adicionar campo de seleção de unidade de medida no cadastro/edição de itens do catálogo de vendas. Quando um item for vendido em "Metro", permitir que a quantidade seja inserida com 2 casas decimais nas vendas.

---

## Arquitetura da Solução

A tabela `vendas_catalogo` já possui a coluna `unidade` (atualmente com valor "UN"). Vamos:
1. Adicionar UI para selecionar a unidade nos formulários de catálogo
2. Propagar a unidade para os produtos da venda
3. Ajustar o input de quantidade para aceitar decimais quando unidade for "metro"

---

## 1. Formulários do Catálogo

### Arquivo: `src/pages/vendas/CatalogoNovoMinimalista.tsx`

**Adicionar campo de seleção de unidade:**

| Campo | Valores |
|-------|---------|
| Unidade | Unitário, Metro, Kg, Litro |

**Localização:** Na seção de "Preço", adicionar um Select para unidade com valor padrão "Unitário".

```text
┌─────────────────────────────────────────────────────────┐
│ Preço de Venda *          │ Custo                       │
│ [___________]             │ [___________]               │
├───────────────────────────┴─────────────────────────────┤
│ Unidade de Venda *                                      │
│ [ Unitário           ▼ ]                                │
│ Ex: Metro para itens vendidos por comprimento           │
└─────────────────────────────────────────────────────────┘
```

### Arquivo: `src/pages/vendas/CatalogoEditMinimalista.tsx`

**Mesma alteração:** Adicionar campo de unidade que carrega o valor existente do banco.

---

## 2. Migração do Banco de Dados

**Atualizar registros existentes para unidade legível:**

```sql
UPDATE vendas_catalogo 
SET unidade = 'Unitário' 
WHERE unidade = 'UN' OR unidade IS NULL;
```

---

## 3. Interface ProdutoVenda

### Arquivo: `src/hooks/useVendas.ts`

**Adicionar campo unidade à interface:**

```typescript
export interface ProdutoVenda {
  // ... campos existentes
  unidade?: string;  // NOVO: unidade de medida do produto
}
```

---

## 4. Modal de Seleção de Produtos

### Arquivo: `src/components/vendas/SelecionarAcessoriosModal.tsx`

**Buscar e propagar a unidade:**

1. Atualizar a query para incluir `unidade` do catálogo
2. Passar `unidade` no objeto `ProdutoVenda` criado

```typescript
// Na query
return data.map(item => ({
  id: item.id,
  nome: item.nome_produto,
  preco: Number(item.preco_venda),
  unidade: item.unidade, // NOVO
  // ...
}));

// No handleConfirmar
const produtos: ProdutoVenda[] = itensSelecionadosArray.map(item => ({
  // ... campos existentes
  unidade: item.unidade, // NOVO
}));
```

---

## 5. Tabela de Produtos da Venda

### Arquivo: `src/components/vendas/ProdutosVendaTable.tsx`

**Permitir quantidade decimal quando unidade for "Metro":**

```typescript
// Verificar se permite decimais
const permiteDecimal = produto.unidade?.toLowerCase() === 'metro';

<Input
  type="number"
  min={permiteDecimal ? "0.01" : "1"}
  step={permiteDecimal ? "0.01" : "1"}
  value={produto.quantidade}
  onChange={(e) => {
    const novaQtd = parseFloat(e.target.value);
    if (novaQtd >= 0.01) {
      onUpdateQuantidade(index, novaQtd);
    }
  }}
  className="w-20"
/>
```

**Exibir unidade na coluna Qtd:**

| Qtd |
|-----|
| 2.50 m |
| 1 un |

---

## 6. Resumo de Alterações

| Arquivo | Alteração |
|---------|-----------|
| **Banco de Dados** | Atualizar registros existentes para `unidade = 'Unitário'` |
| `src/pages/vendas/CatalogoNovoMinimalista.tsx` | Adicionar Select de unidade com padrão "Unitário" |
| `src/pages/vendas/CatalogoEditMinimalista.tsx` | Adicionar Select de unidade (carrega valor existente) |
| `src/hooks/useVendas.ts` | Adicionar `unidade?: string` à interface ProdutoVenda |
| `src/components/vendas/SelecionarAcessoriosModal.tsx` | Buscar e propagar unidade do catálogo |
| `src/components/vendas/ProdutosVendaTable.tsx` | Permitir decimais quando unidade for "Metro" |

---

## Opções de Unidade

| Valor | Descrição |
|-------|-----------|
| Unitário | Item vendido por unidade (padrão) |
| Metro | Item vendido por metro linear |
| Kg | Item vendido por peso |
| Litro | Item vendido por volume |

---

## Fluxo do Usuário

```text
1. Admin cadastra produto no catálogo (/vendas/catalogo/new)
   - Seleciona "Metro" como unidade de venda
   
2. Vendedor cria nova venda (/vendas/minhas-vendas/nova)
   - Abre modal de catálogo
   - Seleciona o produto vendido em metros
   
3. Na tabela de produtos:
   - Campo quantidade permite decimais (ex: 2.50)
   - Exibe "2.50 m" na coluna de quantidade
   
4. Sistema calcula: 2.50 × R$ 45.00 = R$ 112.50
```

---

## Comportamento do Campo Quantidade

| Unidade | min | step | Exemplo |
|---------|-----|------|---------|
| Unitário | 1 | 1 | 1, 2, 3... |
| Metro | 0.01 | 0.01 | 0.50, 1.25, 2.80... |
| Kg | 0.01 | 0.01 | 0.500, 1.250... |
| Litro | 0.01 | 0.01 | 0.5, 1.0... |
