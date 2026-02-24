
# Corrigir filtro de Entregas e pedidos desaparecidos no carregamento

## Problema 1: Correções aparecem na aba Entregas

A pagina `Entregas.tsx` usa o hook `useOrdensCarregamento`, que busca dados diretamente da tabela `ordens_carregamento`. O campo `fonte` nao existe no banco de dados - ele so e atribuido no hook unificado (`useOrdensCarregamentoUnificadas`). Portanto, `ordem.fonte` e sempre `undefined`, e o filtro `ordem.fonte !== 'correcoes'` sempre retorna `true`, sem efeito nenhum.

**Solucao:** Trocar o filtro para usar `ordem.pedido?.etapa_atual !== 'correcoes'`, que e um campo real vindo do join com `pedidos_producao`.

## Problema 2: Pedido 035b9de8 desaparece do carregamento

Este pedido tem registros em duas tabelas:
- `ordens_carregamento`: carregamento_concluido = false (ativo)
- `instalacoes`: carregamento_concluido = true (ja concluido)

A logica de deduplicacao no hook unificado (linha 312) remove o registro de `ordens_carregamento` porque o `pedido_id` aparece em `todosIdsInstalacoes`. Porem, a query de instalacoes (linha 189) filtra por `carregamento_concluido = false`, entao a instalacao ja concluida tambem nao aparece. Resultado: o pedido some completamente.

**Solucao:** Ao construir `todosIdsInstalacoes` para deduplicacao, considerar apenas instalacoes que ainda tem carregamento pendente (`carregamento_concluido = false`). Assim, se a instalacao ja teve o carregamento concluido, o registro de `ordens_carregamento` sera mantido.

## Mudancas

### 1. `src/pages/Entregas.tsx`

Trocar `ordem.fonte !== 'correcoes'` por `ordem.pedido?.etapa_atual !== 'correcoes'`:

```text
const naoECorrecao = ordem.pedido?.etapa_atual !== 'correcoes';
```

### 2. `src/hooks/useOrdensCarregamentoUnificadas.ts`

Alterar a query de deduplicacao de instalacoes (linhas 257-264) para buscar apenas instalacoes com `carregamento_concluido = false`:

```text
const { data: todosInstalacoesPedidoIds } = await supabase
  .from("instalacoes")
  .select("pedido_id")
  .not("pedido_id", "is", null)
  .eq("carregamento_concluido", false);
```

Isso garante que pedidos cujas instalacoes ja tiveram o carregamento concluido nao sejam indevidamente removidos da lista de `ordens_carregamento`.

### Arquivos modificados
1. `src/pages/Entregas.tsx` - corrigir filtro de correcoes
2. `src/hooks/useOrdensCarregamentoUnificadas.ts` - corrigir deduplicacao de instalacoes
