
# Plano: Padronizar botoes de avanco em todas as etapas

## O que muda

Na pagina `/direcao/gestao-fabrica`, os botoes de avancar etapa em todas as etapas terao a mesma largura do botao da etapa "Em Aberto" (`w-full` em vez de `w-[20px]`), ocupando toda a largura da coluna de acoes.

## Detalhes Tecnicos

### Arquivo: `src/components/pedidos/PedidoCard.tsx`

Alterar a classe `w-[20px]` para `w-full` nos botoes de avancar de todas as etapas:

1. **Linha 1477** - Etapa `em_producao`: `w-[20px]` para `w-full`
2. **Linha 1501** - Etapa `inspecao_qualidade`: `w-[20px]` para `w-full`
3. **Linha 1510** - Etapa `aguardando_pintura`: `w-[20px]` para `w-full`
4. **Linha 1526** - Etapas `aguardando_coleta` / `instalacoes`: `w-[20px]` para `w-full`
5. **Linha 1534** - Etapas genericas (fallback): `w-[20px]` para `w-full`

Cada botao passara de:
```tsx
className="flex h-[20px] w-[20px] rounded-[3px]"
```
Para:
```tsx
className="flex h-[20px] w-full rounded-[3px]"
```

Nenhum outro arquivo precisa ser alterado - a grid template ja e a mesma para todas as etapas.
