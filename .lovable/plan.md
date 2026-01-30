
# Plano: Exibir Observação do Pedido na Página de Detalhes

## Resumo

Adicionar uma seção na página `/direcao/pedidos/:id` para exibir a observação do pedido (`observacoes`) juntamente com a data da última atualização do pedido (`updated_at`).

---

## Dados Disponíveis

O pedido atual (`ac9a6d1e-f755-456a-a2b9-8471d4013ef7`) possui:
- **Observação**: "Deixa 1 Meia cana Galvaniza de Cada Tamanho de Meia Cana, Restante das Meia Canas Serão na Cor Cinza Escuro"
- **Última atualização**: 28/01/2026 às 12:38

---

## Alterações Necessárias

### Arquivo: `src/pages/direcao/PedidoViewDirecao.tsx`

#### 1. Atualizar interface Pedido (linha ~40-56)

Adicionar campos:
```typescript
interface Pedido {
  // ... campos existentes
  observacoes?: string | null;      // ADICIONAR
  updated_at?: string;              // ADICIONAR
}
```

#### 2. Atualizar query do Supabase (linha ~71-77)

Incluir `observacoes` e `updated_at` na consulta:
```typescript
.select(`
  id, numero_pedido, etapa_atual, created_at, venda_id,
  ficha_visita_url, observacoes, updated_at,
  vendas!inner(cliente_nome, cidade, estado, valor_venda, forma_pagamento, tipo_entrega, data_prevista_entrega)
`)
```

#### 3. Atualizar setPedido (linha ~128-144)

Incluir os novos campos:
```typescript
setPedido({
  // ... campos existentes
  observacoes: pedidoData.observacoes,
  updated_at: pedidoData.updated_at,
});
```

#### 4. Adicionar import do ícone FileText (linha ~8)

```typescript
import { ..., FileText } from "lucide-react";
```

#### 5. Adicionar seção de Observações (após linha ~398, antes das Ordens de Produção)

```typescript
{/* Observações do Pedido */}
{pedido.observacoes && (
  <Card className="bg-primary/5 border-primary/10 backdrop-blur-xl">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <FileText className="w-4 h-4" />
          Observações do Pedido
        </CardTitle>
        {pedido.updated_at && (
          <span className="text-xs text-white/50">
            Atualizado em {format(new Date(pedido.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-white/80 whitespace-pre-wrap">
        {pedido.observacoes}
      </p>
    </CardContent>
  </Card>
)}
```

---

## Resultado Visual

A página exibirá um novo card entre "Itens do Pedido" e "Ordens de Produção":

```text
┌──────────────────────────────────────────────────────┐
│ 📄 Observações do Pedido       Atualizado em 28/01/2026 às 12:38 │
├──────────────────────────────────────────────────────┤
│ Deixa 1 Meia cana Galvaniza de Cada Tamanho de      │
│ Meia Cana, Restante das Meia Canas Serão na Cor     │
│ Cinza Escuro                                         │
└──────────────────────────────────────────────────────┘
```

---

## Resumo de Alterações

| Local | Alteração |
|-------|-----------|
| Interface Pedido | Adicionar `observacoes` e `updated_at` |
| Query Supabase | Incluir campos na consulta |
| setPedido | Mapear novos campos |
| JSX | Novo card para exibir observações |
| Imports | Adicionar ícone `FileText` |

---

## Observação Técnica

A data exibida será a última atualização do pedido (`updated_at`), que reflete quando qualquer campo foi modificado. Se futuramente for necessário rastrear especificamente quando a observação foi alterada, podemos criar um campo dedicado `observacoes_updated_at` no banco de dados.
