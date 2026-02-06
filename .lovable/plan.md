
# Aplicar Estilo Minimalista com Breadcrumb na Tabela de Precos

## O que sera feito

Envolver o conteudo da pagina `TabelaPrecos` com o componente `MinimalistLayout` (mesmo padrao usado nas demais paginas de direcao), adicionando breadcrumb automatico e removendo o header interno duplicado.

## Alteracoes

### 1. `src/pages/TabelaPrecos.tsx`

- Importar `MinimalistLayout` de `@/components/MinimalistLayout`
- Envolver todo o conteudo no `MinimalistLayout` com:
  - `title="Tabela de Precos"`
  - `subtitle="Gestao de precos das portas por tamanho"`
  - `backPath="/direcao/vendas"`
  - `breadcrumbItems` com: Home > Direcao > Vendas > Tabela de Precos
  - `headerActions` com os botoes "Upload em Massa" e "Novo Item"
- Remover o bloco de header interno (linhas 91-114) que duplicaria titulo e botoes

### 2. `src/App.tsx`

- Remover o `<div className="p-4 md:p-6">` wrapper da rota, pois o `MinimalistLayout` ja cuida do espacamento

## Detalhes Tecnicos

- O `MinimalistLayout` ja aplica fundo preto, texto branco, breadcrumb animado, botao voltar e padding interno
- Os botoes de acao serao movidos para `headerActions` prop, aparecendo no header minimalista
- O breadcrumb sera explicito: `[{label: 'Home', path: '/home'}, {label: 'Direcao', path: '/direcao'}, {label: 'Vendas', path: '/direcao/vendas'}, {label: 'Tabela de Precos'}]`
- Cards e tabela precisarao de ajuste de cores para fundo escuro (usar classes como `bg-white/5`, `border-white/10`, `text-white/60` no lugar de `bg-primary/5`, `text-muted-foreground`)
- 2 arquivos modificados, nenhum arquivo novo
