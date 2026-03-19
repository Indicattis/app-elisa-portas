

## Plano: Mudar fonte de dados dos "Itens Pendentes por Etapa" para `pedido_linhas`

### Problema raiz

O hook `useItensNaoConcluidosPorEtapa` busca dados de `linhas_ordens` (linhas de ordens de produção), mas a maioria dos pedidos em produção ainda não teve ordens criadas. Para "Meia cana lisa - 0,70mm", existem apenas **2 linhas** em `linhas_ordens` não concluídas (totalizando 136m), enquanto há **35 linhas** em `pedido_linhas` para pedidos em produção (totalizando ~337m).

A seção "Itens Pendentes por Etapa" precisa mostrar o total de material necessário com base nas **linhas dos pedidos** (`pedido_linhas`), não nas linhas de ordens de produção.

### Solução

Reescrever o hook `useItensNaoConcluidosPorEtapa` para buscar dados de `pedido_linhas` em vez de `linhas_ordens`:

1. **Consultar `pedido_linhas`** com join em `pedidos_producao` (para `etapa_atual` e `numero_pedido`) e `estoque` (para `nome_produto`)
2. **Mapear os campos** retornados: `quantidade`, `tamanho`, `estoque_nome`, `pedido_numero`, `etapa_atual`
3. **O cálculo de tamanho** permanece igual: `parseTamanho(tamanho) * quantidade`

### Detalhes técnicos

**Arquivo: `src/hooks/useItensNaoConcluidosPorEtapa.ts`**

Query atual:
```
supabase.from("linhas_ordens").select(...).eq("concluida", false)
```

Query nova:
```
supabase.from("pedido_linhas").select(`
  id, quantidade, tamanho, largura, altura,
  estoque:estoque_id (nome_produto),
  pedidos_producao:pedido_id (numero_pedido, etapa_atual)
`)
```

Sem filtro de `concluida` — todas as linhas de pedidos são contabilizadas. A interface `ItemNaoConcluido` será simplificada (remover campos exclusivos de `linhas_ordens` como `tipo_ordem`, `cor_nome`, `pedido_linha_*`).

**Arquivo: `src/pages/administrativo/ProducaoAdminReadOnly.tsx`**

Ajustar referências de campos removidos (se usados no agrupamento). O campo `nome` do agrupamento usa `estoque_nome || item` — na nova query, usará `estoque_nome` diretamente do join.

### Nota sobre volume

`pedido_linhas` para pedidos em produção tem ~567 linhas (dentro do limite de 1000 do Supabase).

### Arquivos impactados
- `src/hooks/useItensNaoConcluidosPorEtapa.ts` — reescrever query
- `src/pages/administrativo/ProducaoAdminReadOnly.tsx` — ajustar campos se necessário

