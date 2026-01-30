
# Plano: Mostrar Porta de cada Item no Pedido

## Problema Identificado

Na página `/direcao/pedidos/:id`, os itens do pedido não mostram para qual porta cada item pertence. A informação já existe no banco de dados no campo `indice_porta` da tabela `pedido_linhas`.

## Alterações Necessárias

### Arquivo: `src/pages/direcao/PedidoViewDirecao.tsx`

**1. Atualizar Interface `PedidoLinha` (linha 32-38)**

Adicionar o campo `indice_porta`:

```typescript
interface PedidoLinha {
  id: string;
  nome_produto: string;
  descricao_produto?: string | null;
  quantidade: number;
  tamanho?: string | null;
  indice_porta?: number | null;  // NOVO
}
```

**2. Atualizar Query de Linhas (linha 84-88)**

Incluir `indice_porta` na consulta:

```typescript
const { data: linhasData } = await supabase
  .from('pedido_linhas')
  .select('id, nome_produto, descricao_produto, quantidade, tamanho, indice_porta')
  .eq('pedido_id', id)
  .order('ordem', { ascending: true });
```

**3. Exibir Badge da Porta (linhas 386-399)**

Adicionar badge indicando a porta quando `indice_porta` estiver definido:

```tsx
{pedido.linhas.map((linha) => (
  <div key={linha.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="font-medium text-white">{linha.nome_produto}</p>
        {linha.indice_porta !== null && linha.indice_porta !== undefined && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/30">
            Porta {linha.indice_porta + 1}
          </Badge>
        )}
      </div>
      {linha.descricao_produto && (
        <p className="text-xs text-white/60">{linha.descricao_produto}</p>
      )}
    </div>
    <div className="flex items-center gap-4 text-white/60 text-xs">
      {linha.tamanho && <span>{linha.tamanho}</span>}
      <span>Qtd: {linha.quantidade}</span>
    </div>
  </div>
))}
```

## Lógica de Exibição

| `indice_porta` | Exibição |
|----------------|----------|
| 0 | Porta 1 |
| 1 | Porta 2 |
| 2 | Porta 3 |
| null/undefined | Não exibe badge |

## Resultado Esperado

Cada item do pedido exibirá um badge azul indicando para qual porta ele pertence (ex: "Porta 1", "Porta 2"), facilitando a identificação visual dos itens por porta.
