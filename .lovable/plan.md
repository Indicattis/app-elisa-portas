
# Plano: Adicionar Tamanho ao Lado da Numeração de Porta na Pintura

## Objetivo

Modificar a exibição do cabeçalho do grupo de porta no setor de pintura para incluir as dimensões diretamente ao lado da numeração.

**Antes:**
```
Porta 1
Pintura: Branco RAL 9010
Dimensões: 3.00m x 4.00m
```

**Depois:**
```
Porta 1 - 3.00m x 4.00m
Pintura: Branco RAL 9010
```

---

## Alteração Necessária

### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

**Localização:** Linhas 744-766 (cabeçalho do grupo de porta no tipoOrdem === 'pintura')

**Mudanças:**

1. Incluir as dimensões no título da porta (linha 747)
2. Remover o bloco separado de dimensões (linhas 761-765) já que a informação estará no título

**Código atual (linha 746-748):**
```tsx
<span className="font-semibold text-sm">
  Porta {index + 1}
</span>
```

**Código novo:**
```tsx
<span className="font-semibold text-sm">
  Porta {String(index + 1).padStart(2, '0')}
  {primeiraLinha.largura && primeiraLinha.altura && (
    <span className="font-normal text-muted-foreground ml-2">
      {formatarDimensoes(primeiraLinha.largura, primeiraLinha.altura)}
    </span>
  )}
</span>
```

---

## Resultado Visual

```text
┌─────────────────────────────────────────────────────────────┐
│ 📦 Porta 01 - 3.00m x 4.00m                            ✓   │
│    Pintura: Branco RAL 9010 (Epóxi)                        │
├─────────────────────────────────────────────────────────────┤
│ ☐ Lâminas - Qtd: 12 - 3.00m                                │
│ ☐ Guias - Qtd: 2 - 4.00m                                   │
│ ☐ Testeira - Qtd: 1                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumo

| Arquivo | Linha | Ação |
|---------|-------|------|
| `src/components/production/OrdemDetalhesSheet.tsx` | 746-765 | Mover dimensões para o título e remover bloco separado |

Alteração simples de ~10 linhas, mantendo a função `formatarDimensoes` já existente.
