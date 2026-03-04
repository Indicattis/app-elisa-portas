

# Adicionar labels de status de carregamento na etapa "Correções"

## Problema

Na linha 1354 do `PedidoCard.tsx`, a variável `isExpedicao` que controla a exibição dos textos "Carregada", "Agendado", "Atrasado" e "Não agendado" só verifica as etapas `aguardando_coleta` e `instalacoes`:

```typescript
const isExpedicao = etapaAtual === 'aguardando_coleta' || etapaAtual === 'instalacoes';
```

A etapa `correcoes` não está incluída, então os pedidos nessa etapa caem no bloco genérico que mostra apenas a data sem label.

## Correção

Adicionar `correcoes` à condição `isExpedicao` em `src/components/pedidos/PedidoCard.tsx` (linha 1354):

```typescript
const isExpedicao = etapaAtual === 'aguardando_coleta' || etapaAtual === 'instalacoes' || etapaAtual === 'correcoes';
```

Isso é uma alteração de uma única linha.

