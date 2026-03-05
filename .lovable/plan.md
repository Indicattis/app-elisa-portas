

# Unificar Custos Administrativos e DRE na tabela `despesas_mensais`

## Situação Atual

- **Admin** (`/administrativo/financeiro/custos/2026-01`): salva em `custos_mensais` (vinculado a `tipos_custos` por `tipo_custo_id`)
- **DRE** (`/direcao/dre/2026-01`): salva em `despesas_mensais` (campos `nome`, `modalidade`, `valor_real`, `tipo_status`)

São tabelas distintas, logo alterações em uma não aparecem na outra.

## Solução

Migrar a página admin de custos para ler/escrever na `despesas_mensais`, usando `tipos_custos` apenas como catálogo de referência (nomes e limites). Assim ambas as páginas compartilham os mesmos dados.

### 1. Refatorar `useCustosMensais.ts`

- `fetchCustosMes(mesDate)`: buscar de `despesas_mensais` onde `mes = mesDate` e `modalidade in ('fixa', 'variavel_nao_esperada', 'projetada')`, fazendo match por `nome` com os `tipos_custos`
- `saveCustosMensaisBatch`: para cada tipo de custo, fazer upsert em `despesas_mensais` usando a combinação `mes + nome` como chave. A `modalidade` será determinada pelo `tipo` do `tipos_custos` ('fixa' → 'fixa', 'variavel' → 'projetada'). O `tipo_status` padrão será 'decretada'.
- `fetchTotaisPorMes`: buscar de `despesas_mensais` em vez de `custos_mensais`

### 2. Adaptar `CustosMesMinimalista.tsx`

- O `formValues` continua indexado por `tipo_custo.id`, mas ao salvar/carregar, faz a correspondência por `nome` com `despesas_mensais`
- Ao carregar, busca despesas do mês e mapeia cada uma ao `tipo_custo` correspondente pelo `nome`

### 3. Arquivos afetados

- `src/hooks/useCustosMensais.ts` — reescrever queries para usar `despesas_mensais`
- `src/pages/administrativo/CustosMesMinimalista.tsx` — ajustar mapeamento de dados (mínimo)

### 4. O que NÃO muda

- `DREMesDirecao.tsx` — já lê de `despesas_mensais`, continua igual
- `tipos_custos` — continua sendo o catálogo de referência
- `useDRE.ts` — já lê de `despesas_mensais`
- Tabela `custos_mensais` — não será removida, apenas deixará de ser usada

