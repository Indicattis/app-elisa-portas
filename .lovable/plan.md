
# Reestruturar tabela e sidebar de detalhes em /direcao/faturamento

## Resumo

Remover 5 colunas da tabela (Vl. Portas, Vl. Pintura, Instalacao, Frete, Previsao Entrega) e ao clicar em uma venda, exibir os detalhes dela na sidebar direita ao inves de navegar para outra pagina. A sidebar mostrara os valores removidos + valor a receber.

## Mudancas

### 1. Remover colunas da tabela

Remover de `COLUNAS_DISPONIVEIS`:
- `valor_porta` (Vl. Portas)
- `valor_pintura` (Vl. Pintura)
- `instalacao` (Instalacao)
- `frete` (Frete)
- `previsao` (Previsao Entrega)

### 2. Adicionar estado de venda selecionada

Novo state: `selectedVenda: Venda | null`

### 3. Alterar comportamento do clique na linha

Ao clicar numa linha da tabela, em vez de `navigate(...)`, setar `selectedVenda` com a venda clicada. Manter um botao na sidebar para navegar ao faturamento se necessario.

### 4. Alterar sidebar direita

Quando uma venda estiver selecionada, a sidebar direita mostrara:

- **Cabecalho**: Nome do cliente + numero da venda + botao fechar (X)
- **Detalhes financeiros** (os valores removidos da tabela):
  - Vl. Portas
  - Vl. Pintura
  - Instalacao
  - Frete
  - Previsao de Entrega
  - Valor a Receber (campo `valor_a_receber` da venda, se `valor_a_receber_faturamento === true`)
- **Botao "Abrir Faturamento"**: navega para `/direcao/faturamento/venda/{id}`

Quando nenhuma venda estiver selecionada, manter o conteudo atual (Resumo + Colunas).

### 5. Buscar campo valor_a_receber

Adicionar `valor_a_receber` e `valor_a_receber_faturamento` no select da query de vendas e na interface `Venda`.

## Detalhes tecnicos

**Arquivo editado:** `src/pages/direcao/FaturamentoDirecao.tsx`

**Interface Venda - adicionar campos:**
```
valor_a_receber?: number | null;
valor_a_receber_faturamento?: boolean;
```

**Query select - adicionar:**
```
valor_a_receber,
valor_a_receber_faturamento,
```

**Colunas removidas de COLUNAS_DISPONIVEIS:**
- `valor_porta`, `valor_pintura`, `instalacao`, `frete`, `previsao`

**Estado novo:**
```
const [selectedVenda, setSelectedVenda] = useState<Venda | null>(null);
```

**Clique na linha:**
```
onClick={() => setSelectedVenda(venda)}
// Em vez de: navigate(`/direcao/faturamento/venda/${venda.id}`)
```

**Sidebar direita condicional:**
- Se `selectedVenda` existir: mostrar detalhes da venda com os valores removidos
- Senao: mostrar resumo + column manager (conteudo atual)

**Layout dos detalhes na sidebar:**
Cards compactos com label + valor para cada item, estilizados com `bg-white/5 border border-white/10 rounded-lg p-3`.
