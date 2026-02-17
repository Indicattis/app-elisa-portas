
# Padronizar exibicao de medidas em metros com 2 casas decimais

## Resumo

Atualizar todos os componentes do projeto que exibem medidas em metros (largura, altura, tamanho) para sempre mostrar 2 casas decimais. A funcao `formatarTamanho` e `formatarDimensoes` ja existem em `src/utils/formatters.ts` — o trabalho e substituir exibicoes "cruas" por essas funcoes.

## Arquivos a alterar

### 1. `src/components/pedidos/MedidasPortasSection.tsx`
- SVG: `${altura}m` e `${largura}m` -> usar `.toFixed(2)` (linhas 51, 63)

### 2. `src/components/pedidos/LinhasAgrupadasPorPorta.tsx`
- `${porta.largura}m x ${porta.altura}m` -> `formatarDimensoes(porta.largura, porta.altura)` (linha 186)
- `${linha.largura}x${linha.altura}` -> formatar com `.toFixed(2)` (linha 108)

### 3. `src/components/pedidos/PedidoDetalhesSheet.tsx`
- `${obs.produto.largura}m x ${obs.produto.altura}m` -> `formatarDimensoes(...)` (linha 690)

### 4. `src/components/pedidos/ObservacoesPortaForm.tsx`
- `${porta.largura}m x ${porta.altura}m` -> `formatarDimensoes(...)` (linha 110)
- Tambem formatar o fallback do `tamanho.split('x')` (linhas 113-114)

### 5. `src/components/pedidos/ObservacoesPortaSocialForm.tsx`
- Mesma correcao que o anterior (linhas 98, 101-102)

### 6. `src/components/pedidos/AcaoEtapaModal.tsx`
- `{largura}m x {altura}m` -> formatar com `.toFixed(2)` (linha 114)

### 7. `src/components/vendas/ProdutosVendaTable.tsx`
- `${produto.largura}x${produto.altura}` -> `formatarDimensoes(...)` ou `.toFixed(2)` (linha 76)

### 8. `src/components/vendas/DescontoVendaModal.tsx`
- `${produto.largura}x${produto.altura}` -> formatar (linha 205)

### 9. `src/components/orcamentos/ProdutosOrcamentoTable.tsx`
- `${produto.largura}x${produto.altura}` -> formatar (linha 78)

### 10. `src/components/instalacoes/OrdemInstalacaoDetails.tsx`
- `formatTamanho` local: `${produto.largura}m x ${produto.altura}m` -> usar `formatarDimensoes` (linha 49)

### 11. `src/components/expedicao/OrdemCarregamentoDetails.tsx`
- `formatTamanho` local: mesma correcao (linha 42)

### 12. `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx`
- `${p.largura}m x ${p.altura}m` -> `formatarDimensoes(...)` (linha 128)

### 13. `src/components/fabrica/LinhasAgrupadasPorPortaSheet.tsx`
- `${linha.largura}x${linha.altura}` -> formatar (linha 108)

### 14. `src/components/fabrica/OrdemLinhasSheet.tsx`
- `Number(linha.largura).toFixed(2)m x Number(linha.altura).toFixed(2)m` -> ja esta OK com `.toFixed(2)`, manter

### 15. `src/pages/PedidoView.tsx`
- `${porta.largura}m x ${porta.altura}m` -> `formatarDimensoes(...)` (linha 580)

### 16. `src/pages/PedidoPreparacao.tsx`
- `${produto.largura} x ${produto.altura}` -> formatar (linha 414)

### 17. `src/pages/administrativo/PedidoViewMinimalista.tsx`
- `${porta.largura}m x ${porta.altura}m` -> `formatarDimensoes(...)` (linha 403)

### 18. `src/pages/direcao/AprovacoesVendas.tsx`
- `${p.largura}x${p.altura}` -> formatar (linha 173)

### 19. `src/pages/direcao/VendaDetalhesDirecao.tsx`
- `produto.largura.toFixed(2) x produto.altura.toFixed(2)m` -> ja esta OK, manter

### 20. `src/components/expedicao/OrdensCarregamentoDisponiveis.tsx`
- `porta.largura.toFixed(2)m x porta.altura.toFixed(2)m` -> ja esta OK, manter

## Estrategia

Usar a funcao `formatarDimensoes` de `src/utils/formatters.ts` onde se exibe "largura x altura" em metros, e `formatarTamanho` onde se exibe um valor unico. Onde necessario, usar `Number(valor).toFixed(2)` inline. Todos os displays passarao a mostrar sempre 2 casas decimais (ex: `2.80m x 3.00m` em vez de `2.8m x 3m`).

Sao aproximadamente 18 arquivos com alteracoes pontuais (1-3 linhas cada).
