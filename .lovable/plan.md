
# Criar paginas de DRE em /direcao/dre

## Resumo

Criar duas novas paginas:
1. **`/direcao/dre`** - Grid de 3 colunas com os 12 meses do ano, cada card mostrando o mes e o faturamento total. Botao "DRE" adicionado ao hub da direcao.
2. **`/direcao/dre/:mes`** - Pagina de detalhe do DRE do mes selecionado com:
   - Grid de faturamento por tipo de produto (Portas, Pintura, Instalacoes, Acessorios, Adicionais, Total)
   - Linha de lucro por tipo de produto
   - Duas secoes lado a lado: despesas fixas e despesas variaveis

## Mudancas

### 1. Adicionar botao "DRE" ao hub da Direcao

**Arquivo:** `src/pages/direcao/DirecaoHub.tsx`

Adicionar item ao array `menuItems`:
```text
{ label: 'DRE', icon: Calculator, path: '/direcao/dre' }
```

### 2. Criar pagina de grid dos meses (`DREDirecao.tsx`)

**Arquivo novo:** `src/pages/direcao/DREDirecao.tsx`

- Layout com `MinimalistLayout`
- Breadcrumb: Home > Direcao > DRE
- Grid de 3 colunas (`grid grid-cols-1 md:grid-cols-3 gap-4`)
- Cada card exibe: nome do mes (ex: "Janeiro"), faturamento total do mes
- Ao clicar num mes, navega para `/direcao/dre/2026-01` (formato yyyy-MM)
- Dados buscados com query ao Supabase: vendas agrupadas por mes do ano atual, somando `valor_venda - valor_frete` por mes
- Estilo minimalista: `bg-white/5 border border-white/10 rounded-xl`

### 3. Criar pagina de detalhe do DRE mensal (`DREMesDirecao.tsx`)

**Arquivo novo:** `src/pages/direcao/DREMesDirecao.tsx`

- Recebe parametro `:mes` da URL (formato `yyyy-MM`)
- Breadcrumb: Home > Direcao > DRE > [Nome do Mes]

**Secao 1 - Grid de Faturamento por Produto:**

Tabela/grid com 6 colunas: Portas | Pintura | Instalacoes | Acessorios | Adicionais | Total

- **Linha 1 (Faturamento):** soma de `valor_produto` dos `produtos_vendas` agrupados por `tipo_produto` para vendas do mes
  - Portas = tipo_produto in ('porta_enrolar', 'porta_social')
  - Pintura = soma de `valor_pintura`
  - Instalacoes = soma de `valor_instalacao`
  - Acessorios = tipo_produto = 'acessorio'
  - Adicionais = tipo_produto in ('adicional', 'manutencao')
  - Total = soma de todos

- **Linha 2 (Lucro):** soma de `lucro_produto` + `lucro_pintura` etc. agrupados da mesma forma
  - Portas = `lucro_produto` onde tipo e porta
  - Pintura = `lucro_pintura`
  - Acessorios/Adicionais = `lucro_item`
  - Total = soma

**Secao 2 - Despesas (lado a lado):**

Duas colunas (`grid grid-cols-1 md:grid-cols-2 gap-4`):

- **Coluna esquerda: Despesas Fixas**
  - Busca `despesas_mensais` onde `mes = yyyy-MM` e `modalidade = 'fixa'`
  - Lista cada despesa com nome e valor_real
  - Total no rodape

- **Coluna direita: Despesas Variaveis**
  - Busca `despesas_mensais` onde `mes = yyyy-MM` e `modalidade = 'variavel'`
  - Lista cada despesa com nome e valor_real
  - Total no rodape

### 4. Registrar rotas no App.tsx

**Arquivo:** `src/App.tsx`

Adicionar duas rotas:
```text
/direcao/dre -> DREDirecao
/direcao/dre/:mes -> DREMesDirecao
```

## Detalhes tecnicos

**Queries Supabase para a pagina de grid (DREDirecao):**
- Buscar vendas do ano atual com `data_venda`, `valor_venda`, `valor_frete`
- Agrupar no frontend por mes e somar faturamento (valor_venda - valor_frete)

**Queries Supabase para a pagina de detalhe (DREMesDirecao):**
- Buscar `produtos_vendas` com join em `vendas` filtrado pelo mes:
  ```
  produtos_vendas(tipo_produto, valor_produto, valor_pintura, valor_instalacao, lucro_produto, lucro_pintura, lucro_item, vendas!inner(data_venda))
  ```
- Buscar `despesas_mensais` filtrado por `mes` e separar por `modalidade`

**Estilizacao:**
- Cards: `rounded-xl bg-white/5 border border-white/10`
- Grid de faturamento: tabela com headers em `text-white/50` e valores em `text-white font-semibold`
- Despesas: cards com lista de items e total destacado no rodape
- Cores: valores positivos em verde, negativos em vermelho para o lucro

**Arquivos criados:**
- `src/pages/direcao/DREDirecao.tsx`
- `src/pages/direcao/DREMesDirecao.tsx`

**Arquivos editados:**
- `src/pages/direcao/DirecaoHub.tsx` (adicionar botao DRE)
- `src/App.tsx` (adicionar rotas + imports)
