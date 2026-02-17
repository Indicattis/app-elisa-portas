
# Corrigir retorno de Neo Instalação finalizada para etapa Correções

## Problema
Ao clicar "Retornar" numa Neo Instalação finalizada na etapa "Finalizado", o sistema reseta o status para `pendente` na mesma tabela `neo_instalacoes`, fazendo o item reaparecer na aba "Instalações". O correto seria enviar para a aba "Correções".

## Solucao
Alterar a logica de retorno para criar uma nova Neo Correcao a partir dos dados da Neo Instalacao finalizada, em vez de simplesmente reverter o status.

## Alteracoes

### 1. `src/hooks/useNeoInstalacoes.ts` - Mutation `retornarMutation`
Alterar a logica da mutation para:
1. Buscar os dados da Neo Instalacao pelo ID
2. Criar um novo registro em `neo_correcoes` com os dados copiados (nome_cliente, cidade, estado, descricao, equipe_id, equipe_nome, tipo_responsavel, autorizado_id, autorizado_nome, valor_total, valor_a_receber)
3. Marcar a Neo Instalacao original como arquivada (`status: 'arquivada'`) para que nao reapareça em nenhuma lista
4. Invalidar queries de `neo_correcoes_listagem` alem das existentes

### 2. `src/components/pedidos/NeoInstalacaoCardGestao.tsx` - Tooltip do botao
Alterar o title do botao de "Retornar para instalações" para "Enviar para correções" e trocar o icone de `Undo2` para algo mais adequado (ex: `ArrowRight` ou manter `Undo2` com label atualizado).

### 3. `src/pages/direcao/GestaoFabricaDirecao.tsx`
Adicionar invalidacao de `neo_correcoes_listagem` no handler `handleRetornarNeoInstalacao` para que a nova correcao apareca imediatamente na aba "Correções".

### Arquivos afetados
- `src/hooks/useNeoInstalacoes.ts` (logica da mutation)
- `src/components/pedidos/NeoInstalacaoCardGestao.tsx` (label do botao)
- `src/pages/direcao/GestaoFabricaDirecao.tsx` (invalidacao de queries)
