
# Mostrar sugestoes para portas sem linhas no pedido

## Problema

As sugestoes de itens padrao (como guias, eixos, motores, etc.) so aparecem quando uma "pasta" (folder) de porta esta aberta. Porem, as pastas so sao criadas a partir de linhas ja existentes no pedido. Como o pedido `896fee3d` tem 0 linhas, nenhuma pasta e criada, e consequentemente nenhuma sugestao aparece.

## Causa raiz

No `PedidoLinhasEditor.tsx`, o agrupamento `gruposOrdenados` (linha 447-472) itera apenas sobre `linhas` existentes. Se nao ha linhas para uma porta, essa porta nao gera uma pasta/folder no grid. Sem pasta, nao ha como abrir e ver as sugestoes.

## Solucao

Alterar a logica de agrupamento para incluir TODAS as portas da venda, mesmo aquelas que ainda nao possuem linhas. Isso garante que pastas vazias aparecam no grid, permitindo que o usuario as abra e veja as sugestoes de itens padrao.

## Detalhes tecnicos

### Arquivo: `src/components/pedidos/PedidoLinhasEditor.tsx`

**Alteracao no `useMemo` de agrupamento (linhas 447-472)**:

Apos agrupar as linhas existentes por porta, adicionar um segundo passo que percorre o array `portas` e cria entradas no mapa para portas que nao apareceram em nenhuma linha:

```typescript
const { gruposOrdenados, semPorta } = useMemo(() => {
  const grupos = new Map<string, { porta: typeof portas[0] | null; portaIndex: number; linhasGrupo: PedidoLinha[] }>();
  const semPortaArr: PedidoLinha[] = [];

  // 1. Agrupar linhas existentes por porta
  for (const linha of linhas) {
    if (linha.produto_venda_id) {
      const key = `${linha.produto_venda_id}_${linha.indice_porta ?? 0}`;
      if (!grupos.has(key)) {
        const portaIdx = portas.findIndex(p =>
          p._originalId === linha.produto_venda_id &&
          p._indicePorta === (linha.indice_porta ?? 0)
        );
        const porta = portaIdx >= 0 ? portas[portaIdx] : null;
        grupos.set(key, { porta, portaIndex: portaIdx, linhasGrupo: [] });
      }
      grupos.get(key)!.linhasGrupo.push(linha);
    } else {
      semPortaArr.push(linha);
    }
  }

  // 2. NOVO: Criar pastas para portas da venda que ainda nao tem linhas
  for (let i = 0; i < portas.length; i++) {
    const porta = portas[i];
    const key = `${porta._originalId}_${porta._indicePorta}`;
    if (!grupos.has(key)) {
      grupos.set(key, { porta, portaIndex: i, linhasGrupo: [] });
    }
  }

  return {
    gruposOrdenados: [...grupos.entries()].sort((a, b) => a[1].portaIndex - b[1].portaIndex),
    semPorta: semPortaArr,
  };
}, [linhas, portas]);
```

Esta alteracao faz com que todas as portas da venda aparecam como pastas no grid, mesmo sem linhas. Quando o usuario abrir uma pasta vazia de uma porta de enrolar, as sugestoes de itens padrao serao exibidas normalmente (desde que esteja em modo edicao).

### Arquivo editado
1. `src/components/pedidos/PedidoLinhasEditor.tsx`
