

## Adicionar pause + comentário em /producao/embalagem

Hoje a aba de Embalagem não tem botão "Aviso de Falta" (pausar) na downbar do `OrdemDetalhesSheet`. Os outros setores (Soldagem, Perfiladeira, Separação) já têm. Vou habilitar embalagem no mesmo padrão e adicionar um campo opcional de **comentário no pedido** dentro do modal de pausa, gravado em `pedido_comentarios`.

### Mudanças

**1. `src/hooks/useOrdemEmbalagem.ts`** — adicionar mutation `pausarOrdem`
- Mesma lógica do `pausarOrdem` em `useOrdemProducao.ts`, mas sobre a tabela `ordens_embalagem`.
- Aceita `{ ordemId, justificativa, linhasProblemaIds?, comentarioPedido? }`.
- Marca linhas selecionadas com `com_problema=true` em `linhas_ordens` (tipo_ordem='embalagem').
- Calcula `tempo_acumulado_segundos` via `calcularTempoExpediente` e atualiza ordem com `pausada=true`, `pausada_em`, `justificativa_pausa`, `responsavel_id=null`.
- Se `comentarioPedido` for informado e não vazio, faz `INSERT` em `pedido_comentarios` (`pedido_id`, `autor_id`, `autor_nome`, `comentario`).
- Invalida `['ordens-embalagem']` no sucesso, toast de confirmação.

**2. `src/components/production/AvisoFaltaModal.tsx`** — adicionar campo de comentário
- Novo `Textarea` opcional "Adicionar comentário ao pedido (opcional)" abaixo da justificativa, com hint explicando que ficará registrado no histórico do pedido.
- Ampliar a assinatura: `onConfirm: (justificativa, linhasProblemaIds?, comentarioPedido?) => Promise<void>`.
- Reset do campo no `resetForm`.
- Mudança 100% retrocompatível: o terceiro parâmetro é opcional, callers existentes (Soldagem/Perfiladeira/Separação) continuam funcionando sem alteração; eles simplesmente passam a ter o campo extra disponível também (consistente entre setores).

**3. `src/components/production/OrdemDetalhesSheet.tsx`** — habilitar fluxo para embalagem
- Incluir `'embalagem'` nas duas condições que renderizam:
  - O botão "Aviso de Falta" (linha 1141).
  - O `<AvisoFaltaModal>` (linha 1183).
- Repassar o novo argumento `comentarioPedido` ao callback `onPausarOrdem(ordem.id, justificativa, linhasIds, comentarioPedido)`.

**4. `src/pages/producao/ProducaoEmbalagem.tsx`** e **`src/pages/fabrica/producao/EmbalagemMinimalista.tsx`**
- Desestruturar `pausarOrdem` do `useOrdemEmbalagem`.
- Passar ao `OrdemDetalhesSheet`:
  - `onPausarOrdem={async (ordemId, justificativa, linhasIds, comentarioPedido) => { await pausarOrdem.mutateAsync({ ordemId, justificativa, linhasProblemaIds: linhasIds, comentarioPedido }); setDetailsOpen(false); }}`
  - `isPausing={pausarOrdem.isPending}`

### Banco

Sem migration. Reutilizamos `pedido_comentarios` (já existente: `pedido_id`, `autor_id`, `autor_nome`, `comentario`, `created_at`) e os campos de pausa já presentes em `ordens_embalagem` (`pausada`, `pausada_em`, `justificativa_pausa`, `tempo_acumulado_segundos`).

### Fora de escopo

- Tela de visualização do comentário (já existe na UI atual de comentários do pedido).
- Retomar ordem pausada (fluxo já tratado pela captura existente).
- Mudanças no painel da Pintura.

### Arquivos

- `src/hooks/useOrdemEmbalagem.ts` (editar)
- `src/components/production/AvisoFaltaModal.tsx` (editar)
- `src/components/production/OrdemDetalhesSheet.tsx` (editar)
- `src/pages/producao/ProducaoEmbalagem.tsx` (editar)
- `src/pages/fabrica/producao/EmbalagemMinimalista.tsx` (editar)

