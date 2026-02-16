

# Adicionar Descricao, Valor Total e Valor a Receber nos cards Neo

## Resumo
Adicionar tres informacoes nos cards de Neo Instalacoes e Neo Correcoes na etapa "Correcoes e Instalacoes" da gestao de fabrica: descricao (ja existe no banco), valor_total e valor_a_receber (campos novos a serem criados).

## Mudancas

### 1. Migracao SQL
Adicionar duas colunas novas em ambas as tabelas:

- `neo_instalacoes`: adicionar `valor_total NUMERIC DEFAULT 0` e `valor_a_receber NUMERIC DEFAULT 0`
- `neo_correcoes`: adicionar `valor_total NUMERIC DEFAULT 0` e `valor_a_receber NUMERIC DEFAULT 0`

### 2. Atualizar tipos TypeScript
- `src/types/neoInstalacao.ts`: adicionar `valor_total` e `valor_a_receber` nos tipos `NeoInstalacao` e `CriarNeoInstalacaoData`
- `src/types/neoCorrecao.ts`: adicionar `valor_total` e `valor_a_receber` nos tipos `NeoCorrecao` e `CriarNeoCorrecaoData`

### 3. Atualizar cards da gestao de fabrica

**`src/components/pedidos/NeoInstalacaoCardGestao.tsx`:**
- No modo **list**: usar colunas placeholder existentes (Col 6 e Col 7 que hoje mostram "—") para exibir valor_total e valor_a_receber formatados em moeda. Adicionar tooltip na descricao no nome do cliente.
- No modo **grid**: adicionar linha com valor total e valor a receber abaixo da localizacao, e manter descricao ja exibida.

**`src/components/pedidos/NeoCorrecaoCardGestao.tsx`:**
- Mesmas alteracoes do card de instalacao, adaptado para correcao.

### 4. Detalhes visuais nos cards (modo list)
- Substituir os placeholders "—" das colunas 6 e 7 por valores monetarios formatados (ex: `R$ 1.500`)
- Valor total em cor neutra, valor a receber em verde se > 0
- No tooltip do nome do cliente, incluir a descricao se existir

### 5. Detalhes visuais nos cards (modo grid)
- Adicionar secao com icone DollarSign mostrando "Total: R$ X.XXX" e "A receber: R$ X.XXX"
- Descricao ja e exibida no modo grid (manter como esta)

### Arquivos envolvidos
- Migracao SQL (novas colunas)
- `src/types/neoInstalacao.ts`
- `src/types/neoCorrecao.ts`
- `src/components/pedidos/NeoInstalacaoCardGestao.tsx`
- `src/components/pedidos/NeoCorrecaoCardGestao.tsx`

