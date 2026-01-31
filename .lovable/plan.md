
# Plano: Ordenação de Pedidos por Cor na Etapa "Em Aberto"

## Objetivo

Na etapa "Em Aberto" (`aberto`), ordenar os pedidos automaticamente por cor da pintura, agrupando pedidos da mesma cor juntos para facilitar a organização da produção.

## Comportamento Atual

- Pedidos são ordenados por `prioridade_etapa` (DESC) e `created_at` (DESC)
- Todos os pedidos novos entram com prioridade 0, ficando ordenados apenas por data de criação

## Comportamento Desejado

Na etapa "Em Aberto":
1. Agrupar pedidos pela **primeira cor** encontrada nos produtos
2. Cores ordenadas alfabeticamente (ex: Azul Escuro, Branco, Cinza Escuro, Preto...)
3. Pedidos **sem cor** ficam ao final da lista

## Estrutura de Dados

A cor está em: `pedido.vendas.produtos_vendas[].cor.nome`

Cores são associadas a produtos do tipo `pintura_epoxi`:
```text
Pedido 0187 → Cinza Escuro
Pedido 0186 → Azul Escuro  
Pedido 0185 → Branco, Preto (primeira = Branco)
Pedido 0184 → Marrom Escuro
Pedido 0183 → Sem cor
```

## Alteração Técnica

### Arquivo: `src/hooks/usePedidosEtapas.ts`

**Adicionar função auxiliar para extrair primeira cor:**

```typescript
const extrairPrimeiraCor = (pedido: any): string | null => {
  const vendaData = Array.isArray(pedido.vendas) 
    ? pedido.vendas[0] 
    : pedido.vendas;
  const produtos = vendaData?.produtos_vendas || [];
  
  // Buscar primeira cor válida (prioriza pintura_epoxi)
  for (const produto of produtos) {
    if (produto.cor?.nome) {
      return produto.cor.nome;
    }
  }
  return null;
};
```

**Modificar o retorno da query para ordenar por cor na etapa "aberto":**

Após a linha ~289 onde retorna `pedidosComBacklog`, adicionar ordenação condicional:

```typescript
// Ordenar por cor na etapa "aberto"
if (etapa === 'aberto') {
  return pedidosComBacklog.sort((a, b) => {
    const corA = extrairPrimeiraCor(a);
    const corB = extrairPrimeiraCor(b);
    
    // Pedidos sem cor vão para o final
    if (!corA && !corB) return 0;
    if (!corA) return 1;
    if (!corB) return -1;
    
    // Ordenar alfabeticamente por nome da cor
    return corA.localeCompare(corB, 'pt-BR');
  });
}

return pedidosComBacklog;
```

## Fluxo da Ordenação

```text
Entrada (ordem por data):
┌────────────────────────────────┐
│ 0187 - Cinza Escuro            │
│ 0186 - Azul Escuro             │
│ 0185 - Branco                  │
│ 0184 - Marrom Escuro           │
│ 0183 - (sem cor)               │
└────────────────────────────────┘

Saída (ordenado por cor):
┌────────────────────────────────┐
│ 0186 - Azul Escuro             │
│ 0185 - Branco                  │
│ 0187 - Cinza Escuro            │
│ 0184 - Marrom Escuro           │
│ 0183 - (sem cor)               │
└────────────────────────────────┘
```

## Considerações

| Aspecto | Comportamento |
|---------|--------------|
| Etapa afetada | Apenas "aberto" |
| Pedidos múltiplas cores | Usa a primeira cor encontrada |
| Pedidos sem cor | Ficam ao final |
| Prioridade manual | Quando usuário reorganiza manualmente, `prioridade_etapa` prevalece |
| Outras etapas | Mantêm ordenação atual (prioridade + data) |

## Resultado Esperado

Na tela `/direcao/gestao-fabrica`, a aba "Em Aberto" mostrará os pedidos agrupados por cor automaticamente, facilitando a visualização e planejamento da produção.
