

# Redesign dos Botoes de Itens Sugeridos - Estilo Minimalista

## Resumo

Redesenhar os cards de produtos no `AdicionarLinhaModal` para seguir o estilo minimalista dark/glassmorphism usado na pagina `/home`, com fundo escuro, backdrop blur, bordas sutis e gradientes nos botoes.

## Estilo de Referencia (/home)

```text
Wrapper externo:  bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl
Botao interno:    bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30 text-white
Hover:            hover:from-blue-400 hover:to-blue-600
```

## Alteracoes

### AdicionarLinhaModal.tsx

**Dialog/Container**:
- Fundo do DialogContent escuro: `bg-zinc-950 border-white/10`
- Textos em branco/cinza claro

**Cards de produto** (substituir o `<Card>` atual):
- Wrapper: `p-1.5 rounded-xl backdrop-blur-xl border bg-white/5 border-white/10`
- Botao interno: `bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-400/30 text-white rounded-lg px-4 py-3 hover:from-blue-400 hover:to-blue-600`
- Nome do produto em branco, descricao em `text-white/60`
- Badges com fundo `bg-white/10 text-white/80` em vez dos variants padrao
- Valores calculados (tamanho, qtd) em `text-blue-300`

**Campo de busca**:
- Input com fundo `bg-white/5 border-white/10 text-white placeholder:text-white/40`
- Icone de busca em `text-white/40`

**Botao "Adicionar Manualmente"**:
- Estilo `bg-white/5 border-white/10 text-white/70 hover:bg-white/10`

**ScrollArea**:
- Remover borda do scroll area, integrar ao fundo escuro

**Formulario manual** (modoManual):
- Labels em `text-white/70`
- Inputs com fundo escuro `bg-white/5 border-white/10 text-white`

**Footer**:
- Botoes com estilo consistente ao tema escuro

### Arquivo modificado

1. `src/components/pedidos/AdicionarLinhaModal.tsx` - Redesign visual completo dos cards e container
