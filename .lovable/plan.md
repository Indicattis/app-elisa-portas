
# Plano: Pular Etapa de Inspeção de Qualidade para Pedidos Apenas com Separação

## Contexto do Problema
Pedidos que possuem **apenas linhas de separação** (sem soldagem/perfiladeira) estão travados na etapa "Inspeção de Qualidade" porque:
1. A função `criar_ordem_qualidade` não cria ordem quando não há linhas de solda/perfiladeira
2. O fluxo atual sempre avança para `inspecao_qualidade` após `em_producao`
3. Sem ordem de qualidade, o pedido não consegue avançar

**Pedidos afetados identificados:** 0152, 0155, 0151

## Solução Proposta

### Modificar lógica de avanço em `usePedidosEtapas.ts`

Adicionar verificação quando o pedido sai de `em_producao`:

```typescript
// Após linha ~578 (dentro do bloco de validação de em_producao)
// Verificar se pedido só tem separação - se sim, pular inspeção de qualidade
if (etapaAtualNome === 'em_producao') {
  const { data: linhasProducao } = await supabase
    .from('linhas_ordens')
    .select('tipo_ordem')
    .eq('pedido_id', pedidoId)
    .in('tipo_ordem', ['soldagem', 'perfiladeira', 'separacao']);
  
  const temSoldaOuPerfiladeira = linhasProducao?.some(
    l => l.tipo_ordem === 'soldagem' || l.tipo_ordem === 'perfiladeira'
  );
  
  if (!temSoldaOuPerfiladeira) {
    // Pular inspeção de qualidade - determinar próxima etapa
    const { data: pedidoData } = await supabase
      .from('pedidos_producao')
      .select('venda_id')
      .eq('id', pedidoId)
      .single();
    
    if (pedidoData?.venda_id) {
      // Verificar pintura
      const { data: produtosComPintura } = await supabase
        .from('produtos_vendas')
        .select('id')
        .eq('venda_id', pedidoData.venda_id)
        .gt('valor_pintura', 0)
        .limit(1);
      
      if (produtosComPintura?.length > 0) {
        etapaDestino = 'aguardando_pintura';
      } else {
        // Verificar tipo de entrega
        const { data: venda } = await supabase
          .from('vendas')
          .select('tipo_entrega')
          .eq('id', pedidoData.venda_id)
          .single();
        
        etapaDestino = venda?.tipo_entrega === 'entrega' 
          ? 'aguardando_coleta' 
          : 'instalacoes';
      }
    }
    console.log('[moverParaProximaEtapa] Pedido só tem separação - pulando inspeção de qualidade → ' + etapaDestino);
  }
}
```

### Local exato da modificação

**Arquivo:** `src/hooks/usePedidosEtapas.ts`

Adicionar lógica de desvio condicional quando sai de `em_producao` (similar à lógica existente para `inspecao_qualidade` na linha 594).

### Fluxo atualizado

```text
┌─────────────────────┐
│    Em Produção      │
└─────────┬───────────┘
          │
     ┌────┴────┐
     │ Tem     │
     │ Solda/  │
     │ Perfil? │
     └────┬────┘
          │
    ┌─────┴─────┐
    │           │
   Sim         Não
    │           │
    ▼           ▼
┌─────────┐  ┌─────────────────┐
│Inspeção │  │ Determinar      │
│Qualidade│  │ próxima etapa   │
└────┬────┘  └────────┬────────┘
     │                │
     │       ┌────────┴────────┐
     │       │                 │
     │   Tem Pintura?    Não Pintura?
     │       │                 │
     │       ▼                 ▼
     │  ┌────────────┐   ┌──────────────┐
     │  │ Aguardando │   │ Tipo Entrega │
     │  │ Pintura    │   └──────┬───────┘
     │  └────────────┘          │
     │                  ┌───────┴───────┐
     ▼                  ▼               ▼
 (continua)        Coleta         Instalação
```

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/usePedidosEtapas.ts` | Modificar | Adicionar lógica de desvio para pedidos só com separação |

## Correção dos Pedidos Travados

Após implementar a correção, os pedidos 0152, 0155 e 0151 poderão ser avançados manualmente usando o botão "Verificar Avanço" já implementado.

Alternativamente, executar SQL para corrigi-los imediatamente:
```sql
-- Identificar próxima etapa para cada pedido travado
UPDATE pedidos_producao 
SET etapa_atual = 'instalacoes', -- ou 'aguardando_pintura'/'aguardando_coleta' conforme tipo_entrega
    updated_at = NOW()
WHERE id IN ('ebc8af18-8c76-4ef0-9552-269b14f3132d', '44e47079-bb1c-4dfd-be92-51b41106ef52', '7380b0b5-e0f4-4088-ab17-0da326334133');
```

## Benefícios
1. Pedidos apenas com separação fluirão corretamente sem travar
2. Mantém inspeção de qualidade obrigatória para produtos soldados/perfilados
3. Consistente com a regra de negócio: separação não requer inspeção formal
