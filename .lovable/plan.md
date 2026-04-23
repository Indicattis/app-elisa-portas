

## Corrigir envio de pedidos para "Aguardando Cliente"

O toast aparece como sucesso, mas o pedido permanece em "Finalizado" e nunca chega à aba "Aguardando Cliente". Há três problemas concorrentes em `handleEnviarAguardandoCliente` (em `src/pages/direcao/GestaoFabricaDirecao.tsx`):

### Causa raiz

1. **CHECK constraint da tabela `pedidos_etapas`** não inclui `'aguardando_cliente'` — então o upsert da nova etapa falha silenciosamente (o erro do `await` não é checado e não é propagado).
2. **O upsert da etapa `finalizado`** está com `data_saida = data_entrada = agora`, o que **sobrescreve** a `data_entrada` original (perdendo o histórico real da finalização).
3. **Erros silenciosos**: as etapas 2, 3 e 4 não checam `error` do retorno, mascarando falhas e sempre exibindo toast de sucesso.

A combinação faz com que mesmo quando o `update` em `pedidos_producao` é executado, falhas downstream impedem que o estado da UI fique correto e a etapa `aguardando_cliente` nunca exista no histórico — por isso o pedido não aparece na nova aba.

### Mudanças

**1. Migration SQL** — atualizar a CHECK da `pedidos_etapas` para incluir `'aguardando_cliente'`:

```sql
ALTER TABLE public.pedidos_etapas DROP CONSTRAINT IF EXISTS pedidos_etapas_etapa_check;
ALTER TABLE public.pedidos_etapas ADD CONSTRAINT pedidos_etapas_etapa_check
CHECK (etapa = ANY (ARRAY[
  'aprovacao_diretor','aberto','aprovacao_ceo','em_producao',
  'inspecao_qualidade','aguardando_pintura','embalagem',
  'aguardando_coleta','aguardando_instalacao','instalacoes',
  'correcoes','aguardando_cliente','finalizado'
]));
```

**2. `src/pages/direcao/GestaoFabricaDirecao.tsx`** — refatorar `handleEnviarAguardandoCliente` e `handleRetornarDeAguardandoCliente`:

- Em `handleEnviarAguardandoCliente`:
  - Etapa 2 (fechar `finalizado`): trocar o `upsert` por um `update` que apenas seta `data_saida = agora` na linha existente (preserva `data_entrada` original).
  - Etapa 3 (criar `aguardando_cliente`): manter `upsert` mas checar `error`.
  - Checar `error` em todas as operações; se qualquer uma falhar, lançar para cair no `catch`.
- Em `handleRetornarDeAguardandoCliente`:
  - Trocar o `upsert` de `aguardando_cliente` por `update` para apenas fechar `data_saida`.
  - Reabrir a etapa `finalizado` via `upsert` com `data_saida=null` (`onConflict: 'pedido_id,etapa'`).
  - O `teor` da movimentação deve ser `'avanco'` ou outro permitido (a tabela só aceita `'avanco' | 'backlog' | 'reorganizacao' | 'criacao'` — `'retrocesso'` quebra a inserção).
  - Checar `error` em todas as operações.

### Fora de escopo

- Outras telas/fluxos.
- Qualquer mudança em `instalacoes`/Neo (já funcionando via tabelas próprias).

### Arquivos

- `supabase/migrations/<novo>.sql` (criar)
- `src/pages/direcao/GestaoFabricaDirecao.tsx` (editar)

