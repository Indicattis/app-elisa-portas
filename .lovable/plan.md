
# Plano: Resolver Pedidos Travados que Deveriam Avançar Automaticamente

## Contexto do Problema
Os pedidos 24 e 8 de Dezembro/2025 estao com todas as ordens de producao concluidas (status=concluido, historico=true, todas as linhas concluidas, sem problemas), mas permaneceram na etapa "Em Producao" em vez de avancar para "Inspecao de Qualidade".

**Causa raiz identificada**: O auto-avanco depende do callback `tentarAvancoAutomatico` ser chamado no momento exato da conclusao da ordem. Se houver:
- Race condition (banco nao persistiu a tempo)
- Bug temporario no codigo
- Conclusao via interface alternativa (admin, migracao, SQL direto)

...o callback nao e disparado e o pedido fica "travado".

---

## Solucao Proposta

### 1. Correcao Imediata - Mover Pedidos Manualmente
Adicionar um botao na pagina `/direcao/gestao-fabrica` para avanco manual dos pedidos travados.

**Arquivo**: `src/pages/direcao/GestaoFabrica.tsx` ou componente relacionado
- Adicionar opcao no menu de contexto do pedido: "Forcar Verificacao de Avanco"
- Ao clicar, executa a mesma logica de `verificarOrdensProducaoConcluidas` e avanca se todas as condicoes forem atendidas

### 2. Adicionar Verificacao de Auto-Avanco na Interface de Gestao
Quando um pedido na etapa "Em Producao" tiver todas as ordens concluidas (indicadas pela borda verde), adicionar um indicador visual e um botao de acao.

**Arquivos a modificar**:
- `src/hooks/usePedidoAutoAvanco.ts`: Expor funcao `verificarEAvancarSeNecessario` que pode ser chamada manualmente
- `src/components/producao/gestao/PedidoGestaoCard.tsx` (ou similar): Adicionar botao de verificacao

### 3. Adicionar Botao "Verificar Avanco" no Sheet de Detalhes
No `PedidoDetalhesSheet.tsx`, quando o pedido estiver em "Em Producao" e todas as ordens estiverem concluidas, mostrar um botao para forcar a verificacao de avanco.

**Arquivo**: `src/components/pedidos/PedidoDetalhesSheet.tsx`
```tsx
// Adicionar botao condicional
{pedido.etapa_atual === 'em_producao' && todasOrdensConcluidas && (
  <Button onClick={verificarEAvancar}>
    Verificar e Avancar
  </Button>
)}
```

---

## Implementacao Tecnica

### Passo 1: Criar funcao reutilizavel de verificacao
Modificar `usePedidoAutoAvanco.ts` para expor uma funcao que pode ser chamada diretamente:

```typescript
const verificarEAvancarManual = useCallback(async (pedidoId: string) => {
  const etapaAtual = await buscarEtapaAtual(pedidoId);
  
  if (etapaAtual === 'em_producao') {
    const deveAvancar = await verificarOrdensProducaoConcluidas(pedidoId);
    if (deveAvancar) {
      // Mostrar modal de progresso e avancar
      await moverParaProximaEtapa.mutateAsync({ pedidoId, skipCheckboxValidation: true });
    }
  }
  // Retorna se avancou ou nao
  return deveAvancar;
}, [...]);
```

### Passo 2: Adicionar botao no PedidoDetalhesSheet
No header do sheet, adicionar um botao "Verificar Avanco" que:
1. So aparece se `etapa_atual === 'em_producao'`
2. Chama `verificarEAvancarManual(pedido.id)`
3. Mostra toast com resultado

### Passo 3: Corrigir pedidos atuais via SQL (opcional)
Para os pedidos 24 e 8 especificos, pode-se executar manualmente:

```sql
UPDATE pedidos_producao 
SET etapa_atual = 'inspecao_qualidade',
    updated_at = NOW()
WHERE id IN ('8c4cd1a9-671b-4b49-be27-458397f9330b', 'b6500ea9-6624-4ed8-91ee-9dd576cb35e6');

-- E criar a entrada na tabela pedidos_etapas
INSERT INTO pedidos_etapas (pedido_id, etapa, data_entrada)
VALUES 
  ('8c4cd1a9-671b-4b49-be27-458397f9330b', 'inspecao_qualidade', NOW()),
  ('b6500ea9-6624-4ed8-91ee-9dd576cb35e6', 'inspecao_qualidade', NOW())
ON CONFLICT (pedido_id, etapa) DO UPDATE SET data_entrada = NOW();
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/usePedidoAutoAvanco.ts` | Modificar | Expor `verificarEAvancarManual` |
| `src/components/pedidos/PedidoDetalhesSheet.tsx` | Modificar | Adicionar botao de verificacao |
| (Opcional) Migracao SQL | Criar | Corrigir pedidos travados existentes |

---

## Beneficios
1. **Correcao imediata**: Pedidos travados podem ser avancados manualmente
2. **Prevencao futura**: Interface clara para verificar e forcar avancos
3. **Manutencao**: Facil identificar e corrigir pedidos com problemas
