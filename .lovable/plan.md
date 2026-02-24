

# Adicionar informacoes de pagamento na sidebar e refletir em /direcao/faturamento

## Contexto

Atualmente, a sidebar direita em `/administrativo/financeiro/faturamento/vendas` exibe apenas as datas de pagamento (Pgto 1 e Pgto 2), que vem da tabela `contas_receber`. O usuario quer que cada data de pagamento tambem mostre:
- A **forma de pagamento** (ja existe no campo `metodo_pagamento` da `contas_receber`)
- Um campo de **observacao** editavel (ja existe o campo `observacoes` na `contas_receber`)
- Um botao para **marcar como pago** (ja existe o campo `status` e `data_pagamento` na `contas_receber`)

Os dados definidos aqui devem ser refletidos nas colunas de `/direcao/faturamento`.

## Nenhuma alteracao no banco de dados necessaria

A tabela `contas_receber` ja possui todos os campos necessarios: `metodo_pagamento`, `observacoes`, `status`, `data_pagamento`. Apenas o codigo frontend precisa ser ajustado.

## Mudancas

### 1. Buscar dados completos de `contas_receber` (ambos os arquivos)

Nos dois arquivos de faturamento, o `select` atual busca apenas `venda_id, metodo_pagamento, data_vencimento`. Sera expandido para incluir `id, status, observacoes, data_pagamento, valor_parcela, numero_parcela`.

O mapa `pagamentosPorVenda` passara a armazenar objetos mais completos com todas essas informacoes, em vez de apenas `{ data1, data2 }`.

**Arquivos:**
- `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` (linhas 241-258)
- `src/pages/direcao/FaturamentoDirecao.tsx` (linhas 260-279)

### 2. Atualizar a interface `Venda` para incluir dados de pagamento

Adicionar campos para armazenar os dados completos de cada pagamento:

```text
interface PagamentoInfo {
  id: string;
  data_vencimento: string;
  metodo_pagamento: string | null;
  status: string;
  observacoes: string | null;
  data_pagamento: string | null;
  valor_parcela: number;
}
```

E na interface `Venda`:
```text
pagamento_1?: PagamentoInfo | null;
pagamento_2?: PagamentoInfo | null;
```

**Arquivos:**
- `src/pages/administrativo/FaturamentoVendasMinimalista.tsx`
- `src/pages/direcao/FaturamentoDirecao.tsx`

### 3. Redesenhar a secao "Datas" da sidebar administrativa

Cada item de pagamento (Pgto 1 e Pgto 2) sera expandido de uma linha simples com data para um card com:
- Data de vencimento e forma de pagamento (ex: "15/02/25 - Boleto")
- Status visual (badge verde "Pago" ou amarelo "Pendente")
- Campo de observacao editavel (textarea inline com salvamento ao sair do foco)
- Botao "Marcar como Pago" que atualiza `status` para `pago` e `data_pagamento` para a data atual na `contas_receber`

Ao marcar como pago ou salvar observacao, uma chamada `supabase.from('contas_receber').update(...)` sera feita usando o `id` do registro.

**Arquivo:** `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` (linhas 852-888)

### 4. Refletir dados nas colunas de /direcao/faturamento

Na pagina da direcao, as colunas `data_pgto_1` e `data_pgto_2` passarao a exibir:
- A data formatada
- Um indicador visual do status (icone ou cor: verde se pago, amarelo se pendente)
- A forma de pagamento abreviada ao lado da data

Na sidebar da direcao (somente leitura), os cards de pagamento mostrarao os mesmos dados (data, forma, status, observacao) mas sem os botoes de edicao.

**Arquivo:** `src/pages/direcao/FaturamentoDirecao.tsx` (linhas 732-739 para colunas, 1001-1035 para sidebar)

### 5. Funcao de atualizacao de pagamento

Criar uma funcao `handleUpdatePagamento` no componente administrativo que:
1. Recebe `contaId`, campo a atualizar (`status`, `observacoes`) e novo valor
2. Faz `supabase.from('contas_receber').update({...}).eq('id', contaId)`
3. Atualiza o estado local para refletir a mudanca sem recarregar tudo

**Arquivo:** `src/pages/administrativo/FaturamentoVendasMinimalista.tsx`

## Resumo de arquivos modificados

1. `src/pages/administrativo/FaturamentoVendasMinimalista.tsx` - Buscar dados completos, redesenhar sidebar, adicionar funcoes de update
2. `src/pages/direcao/FaturamentoDirecao.tsx` - Buscar dados completos, exibir status/forma nas colunas e sidebar (somente leitura)

