

# Otimizar listagem de despesas para tabela compacta (30px por linha)

## O que muda

Substituir a listagem atual de despesas (cards com `space-y-2`, labels empilhados) por uma tabela HTML compacta com linhas de 30px de altura dentro do componente `DespesaSection`.

## Alterações em `src/pages/direcao/DREMesDirecao.tsx`

### Componente `DespesaSection` (linhas 149-201)

Substituir o bloco `<div className="space-y-2">` por uma `<table>` compacta:

```text
┌──────┬────────────────┬──────────────┬──────────────┬────────┐
│ ●/●  │ Nome           │ Despesa real │ Projetado    │  🗑    │
├──────┼────────────────┼──────────────┼──────────────┼────────┤
│  ●   │ Aluguel        │ R$ 3.500,00  │ R$ 3.500,00  │  🗑   │  ← 30px
│  ●   │ Internet       │ R$ 250,00    │ R$ 300,00    │  🗑   │  ← 30px
├──────┼────────────────┼──────────────┼──────────────┼────────┤
│      │ Total          │              │ R$ 3.750,00  │        │
└──────┴────────────────┴──────────────┴──────────────┴────────┘
```

- Cada `<tr>` terá `h-[30px]` com `text-xs`
- Colunas: status dot (w-8), nome (flex-1), valor real, projetado (se disponível), ações
- Header da tabela com `text-[10px] uppercase text-white/40`
- Linha de total no `<tfoot>`
- O formulário de adicionar despesa permanece inalterado acima da tabela

### Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx` — refatorar apenas o bloco de renderização de despesas dentro de `DespesaSection`

