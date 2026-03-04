

# Buscar despesas configuradas ao adicionar no DRE mensal

## O que será feito

No `DespesaSection` do `DREMesDirecao.tsx`, ao adicionar uma despesa fixa ou variável, o sistema buscará os tipos de custos configurados em `/direcao/dre/despesas` (tabela `tipos_custos`) para que o usuário selecione a despesa em um dropdown em vez de digitar o nome manualmente. O valor projetado (Despesa Projetada) será exibido como referência.

## Alterações em `DREMesDirecao.tsx`

1. **Buscar tipos de custos fixos e variáveis** -- já existe `fetchTiposCustosVariaveis` que busca apenas variáveis. Criar um fetch adicional para os fixos, ou buscar todos os tipos ativos e separar por `tipo` ('fixa' / 'variavel').

2. **Passar lista de tipos ao `DespesaSection`** -- nova prop `tiposDisponiveis` com `{id, nome, valor_maximo_mensal}[]`.

3. **Substituir input de nome por select/dropdown** -- ao adicionar despesa, o usuário escolhe de uma lista. Ao selecionar, o nome é preenchido automaticamente e o valor projetado é exibido como referência (placeholder ou label).

4. **Manter opção de valor livre** -- o campo de valor continua editável para o usuário inserir o custo real do mês.

5. **Mapear modalidade corretamente** -- para Despesas Fixas, filtrar `tipo === 'fixa'`; para seções variáveis, filtrar `tipo === 'variavel'`. Folha salarial mantém input livre.

## Detalhes técnicos

- Alterar `fetchTiposCustosVariaveis` para buscar **todos** os tipos ativos (sem filtro de tipo), renomear para `tiposCustosAtivos`
- Separar `tiposCustosFixos` e `tiposCustosVariaveis` via filter no estado
- `DespesaSection` recebe `tiposDisponiveis?: TipoCustoVariavel[]`; quando presente, renderiza `<select>` no lugar do `<input>` de nome
- Ao selecionar um tipo, preencher `form.nome` com o nome do tipo selecionado

## Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx`

