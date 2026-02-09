

# Copiar hub de Instalacoes para dentro de Direcao > Gestao de Instalacoes

## Resumo

Adicionar um botao "Instalacoes" no hub `GestaoInstalacaoDirecao` e criar uma nova pagina `InstalacoesHubDirecao` que eh uma copia de `InstalacoesHub` com paths e breadcrumbs ajustados para `/direcao/gestao-instalacao/instalacoes/...`. As 4 sub-paginas (ordens, equipes, cronograma, ranking) serao reutilizadas diretamente, apenas registradas em novas rotas sob `/direcao/gestao-instalacao/instalacoes/`.

## Detalhes tecnicos

### 1. Adicionar botao "Instalacoes" no hub existente

**Editar `src/pages/direcao/GestaoInstalacaoDirecao.tsx`**:
- Adicionar item ao `menuItems`:
  ```typescript
  { title: "Instalações", icon: HardHat, path: "/direcao/gestao-instalacao/instalacoes" }
  ```
- Adicionar botao voltar e importar `ArrowLeft`, `HardHat`.

### 2. Criar nova pagina hub

**Criar `src/pages/direcao/InstalacoesHubDirecao.tsx`**:
- Copia de `InstalacoesHub.tsx` com:
  - Paths apontando para `/direcao/gestao-instalacao/instalacoes/ordens-instalacoes`, `.../equipes`, `.../cronograma`, `.../ranking`.
  - Breadcrumb: Home > Direcao > Gestao de Instalacoes > Instalacoes.
  - Botao voltar para `/direcao/gestao-instalacao`.

### 3. Registrar rotas no App.tsx

**Editar `src/App.tsx`**:
- Importar `InstalacoesHubDirecao`.
- Adicionar 5 novas rotas com `ProtectedRoute routeKey="direcao_hub"`:
  - `/direcao/gestao-instalacao/instalacoes` -> `InstalacoesHubDirecao`
  - `/direcao/gestao-instalacao/instalacoes/ordens-instalacoes` -> `OrdensInstalacoesLogistica` (reutilizado)
  - `/direcao/gestao-instalacao/instalacoes/equipes` -> `EquipesMinimalista` (reutilizado)
  - `/direcao/gestao-instalacao/instalacoes/cronograma` -> `CronogramaMinimalista` (reutilizado)
  - `/direcao/gestao-instalacao/instalacoes/ranking` -> `RankingEquipesInstalacao` (reutilizado)

### Arquivos

1. **Editar**: `src/pages/direcao/GestaoInstalacaoDirecao.tsx` -- adicionar botao Instalacoes + botao voltar
2. **Criar**: `src/pages/direcao/InstalacoesHubDirecao.tsx` -- hub com paths da direcao
3. **Editar**: `src/App.tsx` -- 5 novas rotas
