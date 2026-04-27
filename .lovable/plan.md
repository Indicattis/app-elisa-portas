## Problema

Em `/producao/separacao`, a ordem **OSE-2026-0159** apareceu após o retrocesso, mas as linhas estão com checkboxes desabilitados — não é possível clicar para concluí-las.

## Causa Raiz

Quando o pedido é retrocedido (via `retroceder_pedido_unificado` ou `retornar_pedido_para_producao`), o SQL faz reset da ordem de separação:

```sql
UPDATE ordens_separacao
SET status = 'pendente', em_backlog = true,
    responsavel_id = NULL,   -- <-- aqui
    data_conclusao = NULL, ...
```

Já em `src/components/production/OrdemDetalhesSheet.tsx`:

```ts
const isResponsavel = ordem.responsavel_id === user?.id;
const temResponsavel = !!ordem.responsavel_id;
const podeMarcarLinhas = temResponsavel && isResponsavel;  // false após retrocesso

// linha 994
disabled={... || !podeMarcarLinhas || ...}
```

Como `responsavel_id` é `NULL` após o retrocesso, ninguém é responsável → checkboxes ficam permanentemente bloqueados até alguém **capturar** a ordem novamente. O usuário hoje não percebe que precisa clicar em "Capturar" porque a ordem aparece direto na visualização que ele tinha antes (provavelmente cache/sheet aberta) ou não há feedback claro de que está sem responsável.

## Comportamento esperado

A ordem retrocedida volta ao estado "A Fazer" (sem responsável) — esse é o comportamento correto e desejado, pois qualquer colaborador da separação pode pegá-la. O que está faltando é deixar evidente no sheet que a ordem precisa ser **recapturada** antes de marcar linhas.

## Solução

### 1. Mostrar aviso e botão "Capturar" no sheet quando ordem está sem responsável

Em `src/components/production/OrdemDetalhesSheet.tsx`:

- Quando `!temResponsavel` (ordem em backlog/sem responsável), exibir um banner no topo do sheet:
  > "Esta ordem está disponível. Clique em **Capturar Ordem** para começar a trabalhar."
- Renderizar um botão grande "Capturar Ordem" usando o handler `onCapturarOrdem` já existente (passado como prop e implementado em `ProducaoSeparacao.tsx`).
- Manter os checkboxes desabilitados (correto), mas adicionar `title`/tooltip explicativo: *"Capture a ordem para marcar as linhas"*.

### 2. Garantir que a ordem retrocedida apareça corretamente no Kanban "A Fazer"

Verificar em `useOrdemProducao.ts` que ordens com `em_backlog = true` e `responsavel_id = NULL` são listadas na coluna "A Fazer" (já é o caso pelo filtro `historico = false`). Apenas confirmar via teste manual após o fix.

### 3. Invalidação de cache reforçada após retrocesso

`useRetrocederPedido.ts` já invalida `['ordens-producao']`. Confirmar que `['ordens-producao', 'separacao', user_id]` está sendo invalidado (key prefix match já deve cobrir).

## Arquivos afetados

- **Editar**: `src/components/production/OrdemDetalhesSheet.tsx` — adicionar banner + botão "Capturar Ordem" quando `!temResponsavel`, e tooltip nos checkboxes.

## Resultado

Após o retrocesso, o usuário abre a ordem OSE-2026-0159 e vê claramente um banner de "Capturar Ordem". Ao clicar, ele se torna responsável e pode marcar as linhas normalmente. O fluxo respeita a regra de que ordens retrocedidas voltam ao backlog para serem recapturadas (memória `retrocesso-pedidos-unificado`).
