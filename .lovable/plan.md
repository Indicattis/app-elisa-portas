

## Plano: Página de Conversões para Google Ads

### Objetivo
Criar uma nova página em `/marketing/conversoes` que lista vendas filtráveis por mês, exibindo data da venda, e-mail e telefone do cliente. O usuário pode copiar os dados em formato TSV (tab-separated) para colar diretamente em uma planilha.

### Dados disponíveis
A tabela `vendas` já possui `data_venda`, `cliente_email` e `cliente_telefone`. Basta consultar vendas onde `is_rascunho = false`, filtrando por mês/ano.

### Alterações

**1. `src/pages/marketing/Conversoes.tsx`** (novo arquivo)
- Seletor de mês/ano (default: mês atual)
- Query Supabase: `vendas` filtradas por `data_venda` no mês selecionado, `is_rascunho = false`
- Tabela com colunas: Data da Venda, E-mail, Telefone
- Botão "Copiar tudo" que copia os dados como TSV (tab entre colunas, newline entre linhas) — formato que planilhas reconhecem automaticamente
- Indicador de quantidade de conversões no mês

**2. `src/pages/marketing/MarketingHub.tsx`**
- Adicionar item no menu: `{ label: "Conversões", icon: Copy, path: "/marketing/conversoes", ativo: true }`

**3. `src/App.tsx`**
- Importar `Conversoes` com lazy loading
- Adicionar rota: `/marketing/conversoes`

### Formato da cópia
Ao clicar "Copiar tudo", o conteúdo copiado será:
```
Data	E-mail	Telefone
15/03/2026	cliente@email.com	11999999999
16/03/2026	outro@email.com	21988888888
```
Cada coluna separada por tab (`\t`), cada linha por `\n` — ao colar no Google Sheets ou Excel, cada valor vai para sua célula correta.

### Arquivos alterados
- `src/pages/marketing/Conversoes.tsx` (novo)
- `src/pages/marketing/MarketingHub.tsx` — novo item no menu
- `src/App.tsx` — nova rota

