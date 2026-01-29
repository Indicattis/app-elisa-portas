
# Plano: Alinhar Colunas do PedidoOrdemCard como em Gestão de Fábrica

## Problema Identificado

O componente `PedidoOrdemCard` usado em `/fabrica/ordens-pedidos` usa layout **flexbox** com `gap-2`, o que faz com que as informações fiquem desalinhadas horizontalmente entre linhas diferentes:

```tsx
// Layout atual (flexbox)
<button className="w-full h-[30px] px-2 flex items-center gap-2">
  {/* Chevron */}
  {/* Número pedido */}
  {/* Nome cliente */}
  {/* Separador */}
  {/* Cor */}
  ...
</button>
```

Já o `PedidoCard` usado em `/direcao/gestao-fabrica` utiliza **CSS Grid** com colunas de largura fixa, garantindo alinhamento perfeito:

```tsx
// Layout de referência (CSS Grid)
<div className="grid items-center gap-2 h-full px-3"
     style={{ gridTemplateColumns: '24px 24px 28px 1fr 70px ...' }}>
```

---

## Solução

Converter o layout do `PedidoOrdemCard` de **flexbox** para **CSS Grid** com colunas de largura fixa, similar ao padrão usado no `PedidoCard`.

### Estrutura de Colunas Proposta

```text
| Chevron | # Pedido | Cliente      | Cor      | Local    | Portas | Metragem | Ordens | Tipo | Avatar |
|  16px   |   55px   | 1fr (flex)   |   80px   |   70px   |  65px  |   90px   |  40px  | 24px |  24px  |
```

---

## Alterações Técnicas

### Arquivo: `src/components/fabrica/PedidoOrdemCard.tsx`

**De (flexbox):**
```tsx
<button
  className="w-full h-[30px] px-2 flex items-center gap-2 ..."
>
```

**Para (CSS Grid):**
```tsx
<button
  className="w-full h-[30px] px-2 grid items-center gap-2 ..."
  style={{
    gridTemplateColumns: '16px 55px 1fr 80px 70px 65px 90px 40px 24px 24px'
  }}
>
```

### Mapeamento das Colunas

| Coluna | Largura | Conteúdo |
|--------|---------|----------|
| 1 | 16px | Chevron (expandir/colapsar) |
| 2 | 55px | Número do pedido (#0123) |
| 3 | 1fr | Nome do cliente (truncado) |
| 4 | 80px | Cor (círculo + nome) |
| 5 | 70px | Localização (cidade/estado) |
| 6 | 65px | Portas P/G |
| 7 | 90px | Metragem (linear e quadrada) |
| 8 | 40px | Contador de ordens |
| 9 | 24px | Ícone tipo (Truck/Wrench) |
| 10 | 24px | Avatar do vendedor |

---

## Tratamento de Colunas Vazias

Para manter o alinhamento mesmo quando um campo não existe (ex: sem cor, sem localização), cada célula renderizará um `<span />` vazio quando não houver dados:

```tsx
{/* Cor - sempre ocupa espaço */}
<div className="flex items-center gap-1 truncate">
  {corPrincipal ? (
    <>
      <div className="w-2.5 h-2.5 rounded-sm border ..." style={{ backgroundColor: corPrincipal.codigo_hex }} />
      <span className="text-[10px] truncate">{corPrincipal.nome}</span>
    </>
  ) : (
    <span className="text-[10px] text-zinc-600">—</span>
  )}
</div>

{/* Localização - sempre ocupa espaço */}
<span className="text-[10px] text-zinc-500 truncate">
  {pedido.localizacao || '—'}
</span>
```

---

## Resultado Visual Esperado

```text
Antes (flexbox - desalinhado):
┌─────────────────────────────────────────────────────────────────┐
│ > #0123 João Silva        | Branco | Curitiba | P:2 | 3.5m | 1/3 │
│ > #0124 Maria Santos Oliveira  | Preto     | | G:1  | 2/2         │
│ > #0125 Pedro       | Cinza | Campo Largo       | P:1 G:2 | 0/5   │
└─────────────────────────────────────────────────────────────────┘

Depois (CSS Grid - alinhado):
┌─────────────────────────────────────────────────────────────────────────┐
│ > │ #0123 │ João Silva             │ Branco │ Curitiba    │ P:2     │ 3.5m  │ 1/3 │ 🚚 │ 👤 │
│ > │ #0124 │ Maria Santos Oliveira  │ Preto  │ —           │ G:1     │ —     │ 2/2 │ 🔧 │ 👤 │
│ > │ #0125 │ Pedro                  │ Cinza  │ Campo Largo │ P:1 G:2 │ —     │ 0/5 │ 🚚 │ 👤 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/fabrica/PedidoOrdemCard.tsx` | Converter de flexbox para CSS Grid com colunas fixas |

---

## Impacto

- **Visual**: Colunas perfeitamente alinhadas entre linhas diferentes
- **Consistência**: Mesmo padrão usado em `/direcao/gestao-fabrica`
- **Legibilidade**: Mais fácil escanear informações verticalmente
- **Sem quebras**: Células vazias mantêm o espaçamento correto

