

## Plano: Exibir "Carregada" para Instalacoes com Carregamento Concluido

### Problema Identificado

Na pagina `/direcao/gestao-fabrica`, pedidos na etapa "Instalacoes" cuja ordem de instalacao foi carregada nao exibem corretamente o status. A coluna de agendamento deve mostrar **"Carregada"** quando o carregamento esta concluido.

**Causa raiz:**
1. O codigo atual busca dados de carregamento apenas de `ordens_carregamento`
2. Para pedidos do tipo instalacao, os dados de carregamento ficam na tabela `instalacoes`
3. A logica de exibicao nao verifica o estado `carregamentoConcluido` para mudar o label

**Dados do banco confirmam:**
- Pedido 0099: `inst_carregamento_concluido: true`, `inst_data_carregamento: 2026-01-28` (em `instalacoes`)
- Maioria dos pedidos de instalacao nao tem registro em `ordens_carregamento`

---

### Solucao

Modificar o `PedidoCard.tsx` em dois pontos:

1. **Corrigir a query de carregamento** para buscar tambem da tabela `instalacoes` quando o pedido esta na etapa `instalacoes`

2. **Atualizar a logica de exibicao** para mostrar "Carregada" quando `carregamentoConcluido === true`

---

### Arquivo a Modificar

| Arquivo | Linhas | Descricao |
|---------|--------|-----------|
| src/components/pedidos/PedidoCard.tsx | 313-348 | Atualizar query para buscar de `instalacoes` |
| src/components/pedidos/PedidoCard.tsx | 1147-1196 | Adicionar condicao para exibir "Carregada" |

---

### Mudanca 1: Query de Carregamento (linhas 313-348)

```text
ANTES:
┌─────────────────────────────────────────────────────────────┐
│ Para etapa 'instalacoes':                                   │
│   - Busca apenas de ordens_carregamento                     │
│   - Muitos pedidos nao tem registro la                      │
│   - Retorna concluido: false mesmo quando esta concluido    │
└─────────────────────────────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────────────────────────────┐
│ Para etapa 'instalacoes':                                   │
│   - Busca de instalacoes (fonte unica de verdade)           │
│   - Retorna carregamento_concluido corretamente             │
│   - Retorna data_carregamento da instalacao                 │
│                                                             │
│ Para etapa 'aguardando_coleta':                            │
│   - Continua buscando de ordens_carregamento                │
└─────────────────────────────────────────────────────────────┘
```

---

### Mudanca 2: Logica de Exibicao (linhas 1147-1196)

```text
ANTES:
┌─────────────────────────────────────────────────────────────┐
│ Se tem data e nao esta atrasado → "Agendado" (verde)        │
│ Se esta atrasado → "Atrasado" (vermelho)                    │
│ Se nao tem data → "Nao agendado" (vermelho)                 │
└─────────────────────────────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────────────────────────────┐
│ Se carregamento concluido → "Carregada" (azul/cinza)       │
│ Se tem data e nao esta atrasado → "Agendado" (verde)        │
│ Se esta atrasado → "Atrasado" (vermelho)                    │
│ Se nao tem data → "Nao agendado" (vermelho)                 │
└─────────────────────────────────────────────────────────────┘
```

---

### Codigo para Mudanca 1 (Query)

```typescript
// Verificar se a ordem de carregamento está concluída e buscar data
const { data: carregamentoCompleto } = useQuery({
  queryKey: ['pedido-carregamento', pedido.id],
  queryFn: async () => {
    if (pedido.etapa_atual !== 'aguardando_coleta' && pedido.etapa_atual !== 'instalacoes') {
      return {
        concluido: false,
        temData: true,
        dataCarregamento: null
      };
    }

    // Para instalações, buscar da tabela instalacoes
    if (pedido.etapa_atual === 'instalacoes') {
      const { data: instalacao } = await supabase
        .from('instalacoes')
        .select('data_carregamento, carregamento_concluido, responsavel_carregamento_nome, tipo_carregamento')
        .eq('pedido_id', pedido.id)
        .maybeSingle();

      const temData = !!instalacao?.data_carregamento;
      const concluido = instalacao?.carregamento_concluido || false;

      return {
        concluido,
        temData,
        dataCarregamento: instalacao?.data_carregamento || null,
        responsavelNome: instalacao?.responsavel_carregamento_nome || null,
        tipoCarregamento: instalacao?.tipo_carregamento || null
      };
    }

    // Para entregas, buscar de ordens_carregamento
    const { data: ordemCarregamento } = await supabase
      .from('ordens_carregamento')
      .select('data_carregamento, carregamento_concluido, responsavel_carregamento_nome, tipo_carregamento')
      .eq('pedido_id', pedido.id)
      .maybeSingle();

    const temData = !!ordemCarregamento?.data_carregamento;
    const concluido = ordemCarregamento?.carregamento_concluido || false;

    return {
      concluido,
      temData,
      dataCarregamento: ordemCarregamento?.data_carregamento || null,
      responsavelNome: ordemCarregamento?.responsavel_carregamento_nome || null,
      tipoCarregamento: ordemCarregamento?.tipo_carregamento || null
    };
  },
  enabled: pedido.etapa_atual === 'aguardando_coleta' || pedido.etapa_atual === 'instalacoes'
});
```

---

### Codigo para Mudanca 2 (Exibicao)

```typescript
{/* Col 6: Data de Carregamento */}
<div className="text-center">
  {(() => {
    const isExpedicao = etapaAtual === 'aguardando_coleta' || etapaAtual === 'instalacoes';
    
    if (isExpedicao) {
      // NOVA CONDICAO: Se carregamento concluído, mostrar "Carregada"
      if (carregamentoConcluido) {
        return (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[9px] font-medium text-zinc-400">
              Carregada
            </span>
            {dataCarregamento && (
              <span className="text-xs font-bold text-zinc-500">
                {format(new Date(dataCarregamento), "dd/MM/yy")}
              </span>
            )}
          </div>
        );
      }
      
      if (!dataCarregamento) {
        return (
          <span className="text-[10px] font-bold text-destructive">
            Não agendado
          </span>
        );
      }
      
      // Verificar se está atrasado
      const dataCarreg = new Date(dataCarregamento);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataCarreg.setHours(0, 0, 0, 0);
      const atrasado = dataCarreg < hoje;
      
      return (
        <div className="flex flex-col items-center leading-tight">
          <span className={cn(
            "text-[9px] font-medium",
            atrasado ? "text-red-600" : "text-green-600"
          )}>
            {atrasado ? "Atrasado" : "Agendado"}
          </span>
          <span className={cn(
            "text-xs font-bold",
            atrasado ? "text-red-600" : "text-green-600"
          )}>
            {format(new Date(dataCarregamento), "dd/MM/yy")}
          </span>
        </div>
      );
    }
    
    // Para outras etapas...
    if (dataCarregamento) {
      return (
        <span title="Data de carregamento" className="text-[10px] font-medium text-muted-foreground">
          {format(new Date(dataCarregamento), "dd/MM/yy")}
        </span>
      );
    }
    
    return <span className="text-[9px] text-muted-foreground/50">—</span>;
  })()}
</div>
```

---

### Resultado Esperado

| Estado | Exibicao Anterior | Exibicao Nova |
|--------|-------------------|---------------|
| Sem data | Nao agendado (vermelho) | Nao agendado (vermelho) |
| Com data, nao concluido | Agendado + data (verde) | Agendado + data (verde) |
| Com data, atrasado | Atrasado + data (vermelho) | Atrasado + data (vermelho) |
| **Carregamento concluido** | Agendado + data (verde) | **Carregada + data (cinza)** |

