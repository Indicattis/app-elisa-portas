

# Correção: Numeração de Portas no Agrupamento de Pintura

## Problema

Em `/producao/pintura`, ao visualizar os detalhes de uma ordem, as portas são agrupadas corretamente por `produto_venda_id`, mas a numeração usa o índice do loop (`index + 1`), que não reflete a sequência correta quando o pedido não inclui todas as portas da venda.

## Solução

Aplicar a mesma lógica implementada em `PedidoViewDirecao.tsx`: criar um mapa de numeração baseado nos `produto_venda_id` únicos das linhas da ordem atual.

## Alterações Técnicas

### Arquivo: `src/components/production/OrdemDetalhesSheet.tsx`

**Linhas 741-751 - Adicionar mapa de numeração antes do agrupamento:**

```typescript
// ANTES (linha 741-751):
const linhasPorPorta = linhasQuePrecisaPintura.reduce((grupos, linha) => {
  const key = linha.produto_venda_id || 'sem_porta';
  if (!grupos[key]) {
    grupos[key] = [];
  }
  grupos[key].push(linha);
  return grupos;
}, {} as Record<string, LinhaOrdem[]>);

return Object.entries(linhasPorPorta).map(([portaId, linhasPorta], index) => {

// DEPOIS:
const linhasPorPorta = linhasQuePrecisaPintura.reduce((grupos, linha) => {
  const key = linha.produto_venda_id || 'sem_porta';
  if (!grupos[key]) {
    grupos[key] = [];
  }
  grupos[key].push(linha);
  return grupos;
}, {} as Record<string, LinhaOrdem[]>);

// Criar mapa de numeração baseado na ordem de aparição dos produto_venda_id únicos
const uniquePortaIds = [...new Set(
  linhasQuePrecisaPintura
    .map(l => l.produto_venda_id)
    .filter((id): id is string => id !== null && id !== undefined)
)];
const portasNumeracaoMap = new Map<string, number>();
uniquePortaIds.forEach((portaId, idx) => {
  portasNumeracaoMap.set(portaId, idx + 1);
});

return Object.entries(linhasPorPorta).map(([portaId, linhasPorta]) => {
```

**Linha 780 - Usar mapa para numeração:**

```tsx
// ANTES:
Porta {String(index + 1).padStart(2, '0')}

// DEPOIS:
Porta {String(portasNumeracaoMap.get(portaId) || 1).padStart(2, '0')}
```

## Resultado Esperado

| produto_venda_id nas linhas | Numeração |
|-----------------------------|-----------|
| 8fe6a751-... (1º encontrado) | Porta 01 |
| 2dbaac84-... (2º encontrado) | Porta 02 |

As portas serão numeradas sequencialmente (01, 02, 03...) baseado apenas nas que existem nesta ordem de pintura específica.

