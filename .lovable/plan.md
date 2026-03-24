

## Plano: Mostrar endereço completo nas downbars de carregamento

### Problema
A downbar mostra apenas bairro, cidade e estado (vindos da tabela `vendas`). O endereço completo (rua, número, complemento, CEP) está na tabela `pedidos_producao` mas não é buscado pelo hook.

### Alterações

**1. `src/hooks/useOrdensCarregamentoUnificadas.ts`**
- Nas 3 queries que buscam `pedidos_producao` (ordens_carregamento, instalacoes, correcoes), adicionar os campos: `endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep`
- Na query de pedidos órfãos, adicionar os mesmos campos
- Atualizar a interface `OrdemCarregamentoUnificada.pedido` para incluir esses campos opcionais

**2. `src/components/carregamento/CarregamentoDownbar.tsx`**
- Na seção de endereço (linha ~221-225), montar o endereço completo usando os campos do pedido, com fallback para os campos da venda:
  - Formato: `Rua X, Nº Y - Bairro, Cidade/UF - CEP`
  - Priorizar dados de `pedido.endereco_*`, com fallback para `venda.bairro/cidade/estado`

### Resultado
O endereço completo aparecerá na downbar de carregamento, incluindo rua, número e CEP quando disponíveis.

