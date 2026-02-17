

# Substituir "Metas Individuais" por "Desempenho Individual" com historico de instalacoes

## Resumo

Renomear a secao "Metas Individuais" para "Desempenho Individual" e, ao clicar em um colaborador, exibir um modal/pagina com todas as instalacoes das quais ele participou (baseado na equipe a que pertence).

## Como funciona

- A secao atual "Metas Individuais" sera renomeada para "Desempenho Individual"
- Ao clicar em um colaborador, em vez de navegar para a pagina de metas individuais (`/direcao/metas/instalacoes/:userId`), sera aberto um modal mostrando as instalacoes em que o colaborador participou
- As instalacoes sao buscadas na tabela `neo_instalacoes` filtrando pelas equipes das quais o colaborador e membro (via `equipes_instalacao_membros`)
- Cada instalacao mostra: cliente, cidade, data, status (concluida ou nao), equipe

## Detalhes tecnicos

### 1. Alterar `MetasInstalacoesDirecao.tsx`

- Renomear titulo da secao de "Metas Individuais" para "Desempenho Individual"
- Trocar icone de `User` para algo como `ClipboardList` ou manter `User`
- Substituir a navegacao `onClick={() => navigate(...)}` por `onClick` que abre um modal com o userId selecionado
- Adicionar estado para controlar o modal: `selectedColaboradorId`

### 2. Criar componente `InstalacoesPorColaboradorModal`

Novo componente em `src/components/metas/InstalacoesPorColaboradorModal.tsx`:

- Recebe `userId`, `open`, `onOpenChange` como props
- Busca as equipes do colaborador via `equipes_instalacao_membros` (filtrando por `user_id`)
- Busca as instalacoes da tabela `neo_instalacoes` filtrando por `equipe_id IN (equipes do colaborador)`
- Tambem busca da tabela `instalacoes` onde `responsavel_instalacao_id = userId`
- Combina e deduplica os resultados
- Exibe em uma lista dentro de um Dialog:
  - Nome do cliente
  - Cidade/Estado
  - Data da instalacao
  - Equipe
  - Status (concluida com badge verde, pendente com badge amarela)
- Ordena por data decrescente (mais recentes primeiro)
- Busca dados do colaborador via `admin_users` para exibir nome e foto no header

### 3. Arquivos modificados/criados

- `src/pages/direcao/MetasInstalacoesDirecao.tsx` - renomear secao e trocar navegacao por modal
- `src/components/metas/InstalacoesPorColaboradorModal.tsx` - novo componente de modal

### Observacao

A rota `/direcao/metas/instalacoes/:userId` continuara existindo no `App.tsx` caso seja utilizada em outros contextos, mas nao sera mais acessada a partir desta pagina.

