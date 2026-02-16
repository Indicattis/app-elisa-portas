

# Adicionar campo "Etapa Causadora" nos servicos Neo

## Resumo
Adicionar um campo selectbox nos modais de criacao e edicao de Neo Correcoes e Neo Instalacoes para que o usuario informe qual etapa do processo de producao causou a necessidade do servico.

## Alteracoes

### 1. Banco de dados - nova coluna
Criar migration adicionando a coluna `etapa_causadora` (tipo `text`, nullable) em ambas as tabelas:
- `neo_correcoes`
- `neo_instalacoes`

### 2. Tipos TypeScript
Atualizar `src/types/neoCorrecao.ts` e `src/types/neoInstalacao.ts` para incluir `etapa_causadora: string | null` no tipo principal e `etapa_causadora?: string | null` no tipo de criacao.

### 3. Modal de Neo Correcao
**Arquivo:** `src/components/expedicao/NeoCorrecaoModal.tsx`
- Adicionar state `etapaCausadora`
- Preencher ao editar / resetar ao criar
- Adicionar um Select entre o campo de descricao e os valores, com as opcoes:
  - Producao (Soldagem)
  - Producao (Perfiladeira)
  - Producao (Separacao)
  - Inspecao de Qualidade
  - Pintura
  - Expedicao
  - Instalacao
- Incluir o campo no objeto `dados` enviado ao `onConfirm`

### 4. Modal de Neo Instalacao
**Arquivo:** `src/components/expedicao/NeoInstalacaoModal.tsx`
- Mesma logica do modal de correcao: state, preenchimento, Select e inclusao no objeto de dados.

### 5. Opcoes da selectbox
Valores armazenados no banco e seus labels:

| Valor | Label |
|-------|-------|
| soldagem | Producao (Soldagem) |
| perfiladeira | Producao (Perfiladeira) |
| separacao | Producao (Separacao) |
| inspecao_qualidade | Inspecao de Qualidade |
| pintura | Pintura |
| expedicao | Expedicao |
| instalacao | Instalacao |

O campo sera opcional (sem validacao obrigatoria).

## Arquivos envolvidos
- Migration SQL (nova)
- `src/types/neoCorrecao.ts`
- `src/types/neoInstalacao.ts`
- `src/components/expedicao/NeoCorrecaoModal.tsx`
- `src/components/expedicao/NeoInstalacaoModal.tsx`
- `src/integrations/supabase/types.ts` (regenerado automaticamente)

