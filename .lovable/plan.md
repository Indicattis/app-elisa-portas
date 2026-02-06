
# Aviso de Espera nos Pedidos

## O que sera feito

Adicionar um botao na primeira coluna de cada linha (onde fica o drag handle) que permite ao usuario registrar um "aviso de espera" com justificativa. Ao preencher o aviso, o pedido vai automaticamente para a ultima posicao na lista (prioridade minima).

## Alteracoes

### 1. Banco de dados - Novos campos em `pedidos_producao`

Criar migration adicionando dois campos:
- `aviso_espera` (text, nullable) - justificativa do motivo de espera
- `aviso_espera_data` (timestamptz, nullable) - data em que o aviso foi registrado

### 2. PedidoCard.tsx - Botao de aviso na primeira coluna

Na primeira coluna da lista (Col 1, onde fica o drag handle ou espaco vazio):
- Quando nao tem drag handle, mostrar um botao com icone de relogio/pausa para abrir o modal de aviso
- Se ja tem aviso de espera, mostrar um indicador visual (icone amarelo/laranja piscando) com tooltip mostrando a justificativa
- Ao clicar, abre um modal para preencher ou remover o aviso

Adicionar uma nova prop `onAvisoEspera` no PedidoCard para chamar a funcao de salvar.

Se o pedido tem aviso de espera, destacar a linha visualmente (borda amarela/laranja sutil).

### 3. Novo componente - AvisoEsperaModal.tsx

Modal com:
- Textarea para justificativa (obrigatorio)
- Botao "Registrar Aviso" que salva no banco e muda prioridade para 0 (ultima posicao)
- Se ja tem aviso, mostrar o aviso atual com opcao de "Remover Aviso" (restaura prioridade padrao)

### 4. PedidosAdminMinimalista.tsx - Handler de aviso de espera

Adicionar funcao `handleAvisoEspera` que:
1. Salva o aviso no campo `aviso_espera` e `aviso_espera_data` do pedido
2. Atualiza `prioridade_etapa` para 0 (minima, vai para o final da lista ordenada por prioridade decrescente)
3. Invalida o cache para atualizar a lista

Passar a funcao como prop para o PedidoCard.

### 5. usePedidosEtapas.ts - Buscar campos de aviso

Incluir `aviso_espera` e `aviso_espera_data` no select da query de pedidos para que os dados estejam disponiveis no PedidoCard.

## Detalhes tecnicos

### Grid da lista (PedidoCard.tsx)
A primeira coluna (24px) atualmente mostra o drag handle ou um espaco vazio. A alteracao sera:
- Se tem `dragHandleProps`: manter drag handle
- Se nao tem `dragHandleProps` E nao tem aviso: mostrar botao de relogio para adicionar aviso
- Se tem aviso: mostrar icone de alerta/pausa com cor amarela e tooltip com a justificativa (clicavel para editar/remover)

### Prioridade (ultima posicao)
O sistema ordena por `prioridade_etapa DESC`. Ao registrar aviso, setar `prioridade_etapa = 0`. Como pedidos normais tem prioridades >= 10, o pedido ira para o final. Ao remover o aviso, setar `prioridade_etapa = 1` (logo acima de 0, para nao pular a fila).

### Arquivos afetados
1. Nova migration SQL - campos `aviso_espera` e `aviso_espera_data`
2. `src/components/pedidos/AvisoEsperaModal.tsx` - novo componente
3. `src/components/pedidos/PedidoCard.tsx` - botao na col 1 + destaque visual
4. `src/pages/administrativo/PedidosAdminMinimalista.tsx` - handler + prop
5. `src/hooks/usePedidosEtapas.ts` - incluir campos no select
6. `src/integrations/supabase/types.ts` - tipos atualizados
