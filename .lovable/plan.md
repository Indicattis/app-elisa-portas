

## /producao/pintura — visualização e abertura da downbar

### Mudanças

**1. `src/hooks/useOrdemPintura.ts`** — remover filtro por usuário
- Tirar `.or(\`responsavel_id.is.null,responsavel_id.eq.${user.user_id}\`)` da query, mantendo apenas `.eq('historico', false)`. Agora todos os usuários enxergam todas as ordens (capturadas por outros, livres, etc.).
- Manter `enabled: !!user?.user_id` (precisa estar logado), e a chave da query continua incluindo `user?.user_id` apenas para isolamento de cache.

**2. `src/components/production/ProducaoPinturaKanban.tsx`** — abrir downbar somente se capturada
- Em `OrdemCard`, criar `const podeAbrirDetalhes = !!ordem.responsavel_id;`.
- Substituir os `onClick={() => onOrdemClick(ordem)}` (avatar à esquerda, área central, círculo do timer e fallback do `Paintbrush`) por handler condicional: só dispara `onOrdemClick(ordem)` quando `podeAbrirDetalhes`.
- Remover `cursor-pointer`/`hover:` quando não capturada e adicionar `cursor-default` para indicar visualmente que não abre. Em mobile, idem.
- O botão "Capturar" continua funcionando normalmente (não está vinculado ao click do card).

### Comportamento resultante

- Lista global: todo operador vê todas as ordens de pintura ativas, com responsável visível quando houver.
- Card sem responsável: clicar não abre nada — só o botão **Capturar** age. Após capturar, o próprio operador (ou qualquer outro) consegue abrir a downbar.
- Card capturado por outro operador: abrir a downbar funciona normalmente (somente leitura/conferência — as ações de marcar linha/finalizar continuam dependentes das regras já existentes no `OrdemDetalhesSheet`/mutations).

### Fora de escopo

- Permissões de quem pode marcar linha ou finalizar (sem mudança).
- Aba "Controle de Fornadas".
- Painéis de Soldagem/Perfiladeira/Separação/Embalagem.

### Arquivos

- `src/hooks/useOrdemPintura.ts` (editar)
- `src/components/production/ProducaoPinturaKanban.tsx` (editar)

