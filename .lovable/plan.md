
# Plano: Contador de Itens Pendentes nos Botoes do Hub de Aprovacoes

## Objetivo
Adicionar um badge/span em cada botao do hub `/direcao/aprovacoes` mostrando a quantidade de itens aguardando aprovacao.

## Alteracao

### Arquivo: `src/pages/direcao/aprovacoes/DirecaoAprovacoesHub.tsx`

**O que muda:**
- Importar `useQuery` e `supabase` para buscar a contagem de pedidos na etapa `aprovacao_ceo`
- Exibir um span com a contagem ao lado do label de cada botao

**Layout do botao atualizado:**

```text
+----------------------------------------------------+
| [Factory]  Aprovações Fábrica              (12)    |
+----------------------------------------------------+
```

## Detalhes Tecnicos

1. Adicionar uma query simples que conta pedidos em `aprovacao_ceo`:

```typescript
const { data: countFabrica } = useQuery({
  queryKey: ['aprovacoes-fabrica-count'],
  queryFn: async () => {
    const { count } = await supabase
      .from('pedidos_producao')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_atual', 'aprovacao_ceo')
      .eq('arquivado', false);
    return count || 0;
  },
});
```

2. Associar a contagem ao item do menu via um mapa de contagens (para escalar quando houver mais botoes no futuro).

3. Renderizar o span como um badge circular alinhado a direita do botao, com estilo `bg-white/20 text-white` para manter consistencia visual. Se a contagem for 0, o badge nao aparece.

```tsx
{count > 0 && (
  <span className="ml-auto bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[24px] text-center">
    {count}
  </span>
)}
```

Apenas o arquivo `DirecaoAprovacoesHub.tsx` sera modificado.
