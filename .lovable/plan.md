

# Adicionar Botao de Tabela de Precos no Header de /direcao/vendas

## O que sera feito

Adicionar um botao com icone `DollarSign` no header da pagina `/direcao/vendas` que navega para `/direcao/vendas/tabela-precos`, e registrar essa rota no `App.tsx` apontando para o componente `TabelaPrecos` ja existente.

## Alteracoes

### 1. `src/pages/direcao/VendasDirecao.tsx`
- Adicionar um novo botao no `headerActions` (antes do botao de Regras), com icone `DollarSign` e title "Tabela de Precos", navegando para `/direcao/vendas/tabela-precos`

### 2. `src/App.tsx`
- Adicionar a rota `/direcao/vendas/tabela-precos` apontando para o componente `TabelaPrecos` (ja importado), protegida com `routeKey="direcao_hub"` seguindo o padrao das demais rotas de direcao

## Detalhes Tecnicos

- O componente `TabelaPrecos` ja existe em `src/pages/TabelaPrecos.tsx` e ja esta importado no `App.tsx`, porem sem rota associada
- O icone `DollarSign` ja esta importado no `VendasDirecao.tsx`
- A rota sera adicionada antes da rota `/direcao/vendas/:id` para evitar conflitos de matching
- 2 arquivos modificados, nenhum arquivo novo
