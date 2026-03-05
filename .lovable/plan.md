

# Redesign da Folha de Pagamento — Estilo Minimalista com Glassmorphism

## Visão Geral

Transformar a página atual (que usa Cards padrão com fundo claro) para o estilo minimalista escuro com glassmorphism, usando o `MinimalistLayout` já existente no projeto — mesmo padrão das páginas de Direção/DRE.

## Alterações em `src/pages/FolhaPagamentoNova.tsx`

### 1. Envolver tudo com `MinimalistLayout`
- Substituir o `<div className="space-y-6">` raiz pelo `<MinimalistLayout>` com:
  - `title="Folha de Pagamento"`
  - `subtitle="Gere a folha mensal dos colaboradores"`
  - `backPath="/administrativo/rh-dp/colaboradores"`
  - `breadcrumbItems` com Home > Administrativo > RH/DP > Colaboradores > Folha de Pagamento

### 2. Substituir Cards por containers glassmorphism
- Trocar os `<Card>` por `<div>` com classes: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4`
- Títulos de seção com `text-white`, subtítulos com `text-white/60`

### 3. Estilizar formulário de configuração
- Labels em `text-white/60 text-xs`
- Inputs/selects com `bg-white/5 border-white/10 text-white`

### 4. Estilizar tabela de colaboradores
- Header: `text-[10px] uppercase text-white/40 border-b border-white/10`
- Linhas: `h-[30px] border-b border-white/5 text-xs text-white`
- Inputs inline: `bg-white/5 border-white/10 text-white`
- Badge modalidade: `bg-white/10 border-white/20 text-white/70`
- Total líquido por colaborador: `text-blue-400 font-bold`

### 5. Resumo com glassmorphism
- Container: `bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl`
- Labels em `text-white/60`, valores em `text-white`
- Total líquido destacado em `text-blue-400`

### 6. Botões de ação
- "Cancelar": `bg-white/5 border-white/10 text-white/70 hover:bg-white/10`
- "Finalizar": gradiente azul `bg-gradient-to-r from-blue-500 to-blue-700`

### 7. Loading state
- Spinner em fundo preto com `text-blue-400`

### 8. Corrigir navigates errados
- Linha 250 e 468: trocar `/dashboard/administrativo/rh/colaboradores` para `/administrativo/rh-dp/colaboradores`
- Linha 225 (onSuccess): mesma correção

### Arquivo afetado
- `src/pages/FolhaPagamentoNova.tsx` — reescrita do JSX de renderização e imports

