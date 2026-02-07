

# Plano: Corrigir formatacao visual confusa na downbar de ordens

## Problema

Na downbar do `OrdemDetalhesSheet`, os numeros estao se juntando visualmente, causando confusao:

- O numero da porta "07" colado na dimensao "4.72m" parece "074.72m"
- A quantidade "7" colada no tamanho "4.85m" parece "74.85m"
- A quantidade "1" colada no tamanho "4.61m" parece "14.61m"

Os dados no banco estao corretos. O problema e puramente visual.

## Solucao

Modificar `src/components/production/OrdemDetalhesSheet.tsx` em dois pontos:

### 1. Cabecalho do grupo (numero da porta + dimensoes)

**Antes (linha ~849):**
```
Porta de Enrolar 07  4.72m x 6.00m
                   ↑ visualmente colados
```

**Depois:**
```
Porta de Enrolar #07 - 4.72m x 6.00m
```

Adicionar "#" antes do numero e " - " antes das dimensoes para separar claramente.

### 2. Quantidade e tamanho das linhas

**Antes (linhas ~923-927):**
```
Qtd: 7  4.85m
       ↑ visualmente colados
```

**Depois:**
```
Qtd: 7x  |  4.85m
```

Adicionar "x" apos a quantidade e um separador visual (ponto ou barra) antes do tamanho.

### Arquivo modificado

1. **Modificar**: `src/components/production/OrdemDetalhesSheet.tsx`
   - Linha ~849: Alterar template do cabecalho para incluir "#" e " - "
   - Linha ~924: Alterar display de quantidade para "{quantidade}x"
   - Linha ~926: Adicionar separador visual antes do tamanho (ex: bullet point ou pipe)

