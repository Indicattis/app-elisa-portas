

## Plano: Adicionar Nome do Cliente na Listagem de /fabrica/ordens-pedidos

### Contexto

A página `/fabrica/ordens-pedidos` exibe uma listagem compacta de pedidos com altura fixa de 30px. Atualmente, o nome do cliente (`cliente_nome`) só aparece quando o card é expandido. A solicitação é exibir o nome do cliente diretamente na linha principal.

---

### Arquivo a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/fabrica/PedidoOrdemCard.tsx` | Modificar | Adicionar nome do cliente na linha compacta |

---

### Mudanca Proposta

Adicionar o nome do cliente apos o numero do pedido, antes do separador. O nome sera truncado para nao ultrapassar o espaco disponivel.

**Antes (linha 78-84):**
```tsx
{/* Número pedido */}
<span className="text-xs font-medium text-white flex-shrink-0">
  #{pedido.numero_pedido}
</span>

{/* Separador */}
<div className="w-px h-4 bg-zinc-700/50 flex-shrink-0" />
```

**Depois:**
```tsx
{/* Número pedido */}
<span className="text-xs font-medium text-white flex-shrink-0">
  #{pedido.numero_pedido}
</span>

{/* Nome do cliente */}
<span className="text-[10px] text-zinc-300 truncate max-w-[150px] min-w-0">
  {pedido.cliente_nome}
</span>

{/* Separador */}
<div className="w-px h-4 bg-zinc-700/50 flex-shrink-0" />
```

---

### Detalhes de Estilo

- **Tamanho fonte**: `text-[10px]` - consistente com outros elementos da linha
- **Cor**: `text-zinc-300` - ligeiramente mais claro que os elementos secundarios para destaque
- **Truncamento**: `truncate max-w-[150px]` - limita largura para nao quebrar o layout compacto
- **min-w-0**: Permite que o elemento encolha corretamente dentro do flexbox

---

### Layout Visual Resultante

```text
[>] #0097/25 FERNANDO FIGUEIRO LTDA | [Cor] Sao Paulo/SP P:2 G:1 [5.2m] [12.5m²] 3/5 [Truck] [Avatar]
```

---

### Resultado Esperado

O nome do cliente aparecera diretamente na linha compacta de cada pedido, facilitando a identificacao rapida sem precisar expandir o card.

