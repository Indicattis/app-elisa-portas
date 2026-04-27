## Problema

Em `/producao/separacao`, a ordem **OSE-2026-0159** apareceu após o retrocesso, mas as linhas estão com checkboxes desabilitados — não é possível clicar para concluí-las.

## Causa Raiz

O retrocesso (via `retroceder_pedido_unificado`) reseta `responsavel_id = NULL` na ordem, devolvendo-a ao backlog (comportamento correto — qualquer colaborador pode pegá-la).

Em `OrdemDetalhesSheet.tsx`:
```ts
const isResponsavel = ordem.responsavel_id === user?.id;
const temResponsavel = !!ordem.responsavel_id;
const podeMarcarLinhas = temResponsavel && isResponsavel;  // false após retrocesso
```

Como ninguém é responsável, os checkboxes ficam bloqueados sem nenhum feedback visual claro de que é preciso **Capturar** a ordem novamente.

## Solução

### Editar `src/components/production/OrdemDetalhesSheet.tsx`

1. **Banner no topo do sheet** quando `!temResponsavel`:
   > "Esta ordem está disponível. Clique em **Capturar Ordem** para começar a trabalhar nela."
   - Estilo de aviso (amber/warning) coerente com o glassmorphism existente.

2. **Botão "Capturar Ordem"** em destaque dentro do banner, usando o handler `onCapturarOrdem` já existente como prop (passado por `ProducaoSeparacao.tsx`).

3. **Tooltip nos checkboxes desabilitados** explicando: *"Capture a ordem para marcar as linhas"*.

4. Manter os checkboxes desabilitados (regra correta — só o responsável pode marcar).

## Arquivos afetados

- **Editar**: `src/components/production/OrdemDetalhesSheet.tsx`

## Resultado

Após retroceder a OSE-2026-0159, ao abrir o sheet o usuário vê o banner com o botão "Capturar Ordem". Ao clicar, ele se torna responsável e os checkboxes ficam habilitados imediatamente. Comportamento consistente com a regra de retrocesso unificado (ordens voltam ao backlog para serem recapturadas).
