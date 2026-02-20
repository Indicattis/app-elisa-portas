
# Transformar /producao/meu-historico no Estilo Minimalista

## O que muda

A pagina `/producao/meu-historico` sera convertida do estilo padrao (Cards brancos com ProducaoLayout) para o estilo minimalista escuro com glassmorphism, identico ao usado em `/logistica/instalacoes/ranking`.

## Alteracoes

### 1. `src/App.tsx` (~linha 700-709)

Remover o wrapper `ProducaoLayout` da rota `/meu-historico` dentro do producao, pois o `MinimalistLayout` ja fornece seu proprio layout completo (fundo preto, header, breadcrumb, botao voltar).

### 2. `src/pages/ProducaoMeuHistorico.tsx`

Reescrever a pagina para usar o estilo minimalista:

- Importar `MinimalistLayout` no lugar dos componentes `Card`, `Button`, `ArrowLeft`
- Envolver todo o conteudo com `MinimalistLayout` (title, subtitle, backPath para `/producao`, breadcrumbItems)
- Substituir os Cards de estatisticas por containers glassmorphism: `bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl`
- Icones de estatisticas com fundo `bg-blue-500/20` e cor `text-blue-400` (mesmo padrao do ranking)
- Filtros dentro de container glassmorphism com selects estilizados (`bg-white/5 border-white/10 text-white`)
- Lista de ordens com container glassmorphism, dividers `divide-white/5`, hover `hover:bg-white/5`
- Textos: titulos em `text-white`, secundarios em `text-white/60`, terciarios em `text-white/40`
- Badge de tempo em `text-blue-400` ao inves de `text-primary`
- Badge de setor mantendo as cores existentes com `text-white`

### Resultado visual

A pagina tera o mesmo visual escuro e elegante do ranking de equipes, com fundo preto, cards com efeito glassmorphism, e a navegacao integrada do MinimalistLayout (breadcrumb animado + botao voltar).
