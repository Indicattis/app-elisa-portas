# Sistema Unificado de Retrocesso de Pedidos

## Status: ✅ IMPLEMENTADO

### Resumo da Implementação

O sistema de retrocesso padronizado foi implementado com sucesso para:
- `/logistica/instalacoes/ordens-instalacoes` (nova funcionalidade)
- `/direcao/gestao-fabrica` (refatorado para usar modal unificado)

### Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/useRetrocederPedido.ts` | Hook para gerenciar retrocesso com busca de ordens e mutation |
| `src/components/pedidos/RetrocederPedidoUnificadoModal.tsx` | Modal unificado com lógica condicional por etapa destino |
| Migration SQL | Função RPC `retroceder_pedido_unificado` |

### Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/components/instalacoes/OrdemInstalacaoRow.tsx` | Adicionado botão de retroceder e prop `onRetroceder` |
| `src/pages/logistica/OrdensInstalacoesLogistica.tsx` | Integrado modal de retrocesso |
| `src/components/pedidos/PedidoCard.tsx` | Substituído `RetrocederEtapaModal` por `RetrocederPedidoUnificadoModal` |

### Regras de Retrocesso por Etapa Destino

| Destino | Ordens Excluídas | Ordens Gerenciadas | Backlog |
|---------|------------------|--------------------|----|
| `aberto` | TODAS | - | NÃO |
| `em_producao` | qualidade, pintura, instalação, carregamento | soldagem, perfiladeira, separação (manter/pausar/reativar) | SIM |
| `aguardando_pintura` | instalação, carregamento | - (pintura recriada/resetada) | SIM |
