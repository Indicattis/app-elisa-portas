

# Reorganizar layout de despesas: "Despesa real" e "Projetado" lado a lado

## Alteração

Na listagem de despesas dentro do `DespesaSection` (linhas 152-192 de `DREMesDirecao.tsx`), reorganizar cada item para:

1. **Linha superior** com dois labels lado a lado: "Despesa real" (à esquerda) e "Projetado" (à direita, só se houver tipo correspondente)
2. **Linha inferior** com os valores correspondentes: valor real à esquerda, valor projetado à direita

Layout de cada despesa:
```text
● Nome da despesa
  Despesa real          Projetado
  R$ 1.200,00           R$ 1.500,00/mês
```

### Mudanças em `DREMesDirecao.tsx` (linhas 153-186)

- Mover o valor real (`d.valor_real`) para dentro do bloco de conteúdo do item
- Adicionar labels "Despesa real" e "Projetado" como cabeçalhos inline
- Posicionar ambos os valores abaixo dos respectivos labels, alinhados lado a lado
- Manter o botão de delete no hover

## Arquivo afetado
- `src/pages/direcao/DREMesDirecao.tsx`

