
# Plano: Criar Página de Edição Simplificada para Estoque Fábrica

## Objetivo

Criar uma nova página de edição específica para `/estoque/fabrica/editar-item/:id` que exibe apenas os campos relevantes para gerenciamento de estoque, removendo campos de produção.

---

## Análise do Banco de Dados

### Campos existentes na tabela `estoque`:
| Campo | Tipo | Uso |
|-------|------|-----|
| `quantidade` | integer | Quantidade atual em estoque |
| `quantidade_ideal` | integer | Quantidade mínima desejada |
| `custo_unitario` | numeric | Custo por unidade |
| `unidade` | text | Unidade de medida (UN, KG, M, etc.) |
| `fornecedor_id` | uuid | Referência ao fornecedor |

### Campo faltante:
- `quantidade_maxima` - **Não existe** na tabela atual

---

## Alterações Necessárias

### 1. Migration SQL - Adicionar coluna quantidade_maxima

```sql
ALTER TABLE estoque ADD COLUMN quantidade_maxima integer DEFAULT 0;
```

### 2. Novo Componente: `src/pages/estoque/EstoqueFabricaEdit.tsx`

Campos que serão exibidos:
- Nome do Produto
- Descrição
- Quantidade Atual (somente leitura - para referência)
- Quantidade Mínima (quantidade_ideal)
- Quantidade Máxima (nova coluna)
- Custo Unitário
- Unidade de Medida (UN, KG, M, L, M², CX)
- Fornecedor (select dos fornecedores cadastrados)

Campos REMOVIDOS (não aparecerão):
- "Este item requer pintura na produção"
- "Configurações de Cálculo Automático" (módulo, valor, eixo)
- "Item padrão para porta de enrolar"
- "Regras de Quebra de Etiquetas"
- "Setor de Produção"

### 3. Atualizar `src/App.tsx`

Trocar o import para usar o novo componente:
```typescript
import EstoqueFabricaEdit from "./pages/estoque/EstoqueFabricaEdit";

// Rota
<Route path="/estoque/fabrica/editar-item/:id" element={
  <ProtectedRoute routeKey="estoque_fabrica">
    <EstoqueFabricaEdit />
  </ProtectedRoute>
} />
```

### 4. Atualizar tipos em `src/hooks/useEstoque.ts`

Adicionar `quantidade_maxima` nas interfaces.

---

## Estrutura Visual da Página

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Editar Produto                                              │
│   Gerencie as informações de estoque do produto               │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Informações do Produto                                   │  │
│ │                                                          │  │
│ │ Nome do Produto *                                        │  │
│ │ [________________________]                               │  │
│ │                                                          │  │
│ │ Descrição                                                │  │
│ │ [________________________]                               │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Controle de Estoque                                      │  │
│ │                                                          │  │
│ │ ┌─────────────────┐  ┌─────────────────┐                 │  │
│ │ │ Qtd. Atual: 150 │  │ Custo: R$ 12,50 │                 │  │
│ │ └─────────────────┘  └─────────────────┘                 │  │
│ │                                                          │  │
│ │ Quantidade Mínima        Quantidade Máxima               │  │
│ │ [___50___]               [___200___]                     │  │
│ │                                                          │  │
│ │ Custo Unitário (R$)      Unidade de Medida               │  │
│ │ [___12.50___]            [Quilograma (KG) ▼]             │  │
│ │                                                          │  │
│ │ Fornecedor                                               │  │
│ │ [Fornecedor ABC ▼]                                       │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Histórico de Movimentações                               │  │
│ │ ┌────────┬────────┬─────┬─────────┬─────────┬─────────┐  │  │
│ │ │ Data   │ Tipo   │ Qtd │ Anterior│ Novo    │ Obs.    │  │  │
│ │ ├────────┼────────┼─────┼─────────┼─────────┼─────────┤  │  │
│ │ │ 30/01  │Entrada │ 50  │ 100     │ 150     │ Compra  │  │  │
│ │ └────────┴────────┴─────┴─────────┴─────────┴─────────┘  │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                               │
│              [🗑️ Excluir]  [Cancelar]  [Salvar Alterações]    │
└──────────────────────────────────────────────────────────────┘
```

---

## Indicadores Visuais de Estoque

A página mostrará alertas baseados nas quantidades:
- **Verde**: Estoque dentro do ideal (entre min e max)
- **Amarelo**: Estoque se aproximando do mínimo
- **Vermelho**: Estoque abaixo do mínimo ou acima do máximo

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/[timestamp].sql` | Criar - adicionar coluna quantidade_maxima |
| `src/pages/estoque/EstoqueFabricaEdit.tsx` | Criar - página de edição simplificada |
| `src/App.tsx` | Editar - trocar componente da rota |
| `src/hooks/useEstoque.ts` | Editar - adicionar quantidade_maxima nas interfaces |
| `src/integrations/supabase/types.ts` | Será atualizado automaticamente |

---

## Breadcrumb da Página

```
Home > Estoque > Fábrica > Editar Produto
```

---

## Observações

1. O campo "Quantidade Atual" será exibido apenas como referência (somente leitura)
2. Movimentações de estoque continuam sendo feitas pela lista principal
3. O histórico de movimentações será mantido na página de edição
4. Os fornecedores serão carregados do hook `useFornecedores` existente
