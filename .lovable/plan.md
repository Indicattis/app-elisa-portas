
# Renomear rota e adicionar metas para equipes e gerente do setor de instalacoes

## Resumo

1. Renomear a rota de `/direcao/metas/fabrica/instalacoes` para `/direcao/metas/instalacoes`
2. Criar tabela `metas_instalacao` no banco de dados para armazenar metas de equipes e do gerente do setor
3. Adicionar na pagina a possibilidade de criar/visualizar metas para equipes e para o gerente, com data de vigencia e quantidade de portas

## Alteracao de rota

Todos os locais que referenciam `/direcao/metas/fabrica/instalacoes` serao atualizados:
- `App.tsx` (rota)
- `MetasHubDirecao.tsx` (link do menu)
- `MetasInstalacoesDirecao.tsx` (navegacao interna para colaborador individual)

## Nova tabela: `metas_instalacao`

Campos:
- `id` (uuid, PK)
- `tipo` (text: 'equipe' ou 'gerente')
- `referencia_id` (uuid) - ID da equipe ou user_id do gerente
- `quantidade_portas` (integer) - meta de portas a instalar
- `data_inicio` (date)
- `data_termino` (date)
- `concluida` (boolean, default false)
- `created_at`, `updated_at` (timestamptz)
- `created_by` (uuid)

RLS habilitado com politicas para usuarios autenticados (select, insert, update, delete).

## Alteracoes na pagina `MetasInstalacoesDirecao.tsx`

A pagina sera expandida com tres secoes:

### Secao 1 - Meta do Gerente do Setor
- Busca o gerente do setor "instalacoes" via `setores_lideres`
- Exibe card do gerente com meta ativa (se existir)
- Botao para criar/editar meta com formulario: data inicio, data termino, quantidade de portas

### Secao 2 - Metas por Equipe
- Para cada equipe, exibe a meta ativa (se existir)
- Botao para criar/editar meta em cada equipe
- Formulario: data inicio, data termino, quantidade de portas

### Secao 3 - Colaboradores Individuais (existente)
- Mantem a listagem atual de colaboradores agrupados por equipe

## Detalhes tecnicos

### 1. Migracao SQL

```sql
CREATE TABLE public.metas_instalacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('equipe', 'gerente')),
  referencia_id uuid NOT NULL,
  quantidade_portas integer NOT NULL,
  data_inicio date NOT NULL,
  data_termino date NOT NULL,
  concluida boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.metas_instalacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select" ON public.metas_instalacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert" ON public.metas_instalacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update" ON public.metas_instalacao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete" ON public.metas_instalacao FOR DELETE TO authenticated USING (true);
```

### 2. Hook: `src/hooks/useMetasInstalacao.ts` (novo)

- `useMetasInstalacao()` - busca todas as metas ativas da tabela `metas_instalacao`
- `useCriarMetaInstalacao()` - mutation para inserir meta
- `useAtualizarMetaInstalacao()` - mutation para atualizar meta

### 3. Atualizar `App.tsx`

- Rota `/direcao/metas/fabrica/instalacoes` vira `/direcao/metas/instalacoes`
- Rota individual de colaborador continua como `/direcao/metas/fabrica/:userId` (sem mudanca)

### 4. Atualizar `MetasHubDirecao.tsx`

- Alterar path de "Instalacoes" de `/direcao/metas/fabrica/instalacoes` para `/direcao/metas/instalacoes`

### 5. Atualizar `MetasInstalacoesDirecao.tsx`

- Atualizar link de navegacao do colaborador de `/direcao/metas/fabrica/instalacoes/:userId` para `/direcao/metas/instalacoes/:userId`
- Importar e usar `useSetoresLideres` para buscar gerente do setor
- Importar e usar `useMetasInstalacao` para metas de equipes/gerente
- Adicionar modal/dialog para criar meta com campos: data inicio, data termino, quantidade de portas
- Adicionar secao de gerente no topo e metas por equipe antes da listagem de colaboradores
- Atualizar breadcrumbs (remover "Fabrica" do caminho)

### 6. Adicionar rota individual em `App.tsx`

- Nova rota `/direcao/metas/instalacoes/:userId` apontando para `MetasColaboradorIndividual`

### Arquivos modificados/criados

- Migracao SQL (nova tabela `metas_instalacao`)
- `src/hooks/useMetasInstalacao.ts` (novo)
- `src/pages/direcao/MetasInstalacoesDirecao.tsx` (expandido)
- `src/pages/direcao/MetasHubDirecao.tsx` (path atualizado)
- `src/App.tsx` (rotas atualizadas)
