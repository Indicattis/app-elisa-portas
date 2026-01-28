

## Plano: Corrigir Calendário para Exibir Instalações Agendadas

### Problema Identificado

Quando uma **instalação** é agendada via modal, o update vai corretamente para a tabela `instalacoes`. Porém, o calendário em `/logistica/expedicao` usa o hook `useOrdensCarregamentoCalendario` que **só busca dados da tabela `ordens_carregamento`**, nunca exibindo instalações agendadas.

```text
┌─────────────────────────────────────────────────────────────┐
│ FLUXO ATUAL (COM PROBLEMA)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Modal: Agendar instalação para 28/01                        │
│        │                                                    │
│        ▼                                                    │
│ UPDATE instalacoes SET data_carregamento = '2026-01-28'     │
│        │                                                    │
│        ✓ Sucesso!                                           │
│                                                             │
│ Calendário: useOrdensCarregamentoCalendario                 │
│        │                                                    │
│        ▼                                                    │
│ SELECT * FROM ordens_carregamento WHERE data BETWEEN ...    │
│        │                                                    │
│        ⚠️ Instalações nunca são buscadas!                   │
│        │                                                    │
│        ▼                                                    │
│ Calendário vazio (instalações não aparecem)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Solucao

Atualizar o hook `useOrdensCarregamentoCalendario` para tambem buscar instalacoes com `data_carregamento` definido no periodo selecionado.

---

### Arquivo a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/hooks/useOrdensCarregamentoCalendario.ts` | Modificar | Buscar tambem da tabela `instalacoes` e combinar resultados |

---

### Mudancas no Hook

O hook atualmente faz:
```typescript
const { data: ordens = [] } = useQuery({
  queryFn: async () => {
    const { data } = await supabase
      .from("ordens_carregamento")  // ← Só busca daqui!
      .select(...)
      .gte("data_carregamento", inicio)
      .lte("data_carregamento", fim);
    return data;
  },
});
```

**Novo fluxo:**

```typescript
const { data: ordens = [] } = useQuery({
  queryFn: async () => {
    // 1. Buscar de ordens_carregamento
    const { data: ordensCarregamento } = await supabase
      .from("ordens_carregamento")
      .select(...)
      .gte("data_carregamento", inicio)
      .lte("data_carregamento", fim);

    // 2. Buscar de instalacoes COM data_carregamento definida
    const { data: instalacoes } = await supabase
      .from("instalacoes")
      .select(...)
      .gte("data_carregamento", inicio)
      .lte("data_carregamento", fim)
      .eq("carregamento_concluido", false);

    // 3. Normalizar instalacoes para o formato OrdemCarregamento
    const instalacoesNormalizadas = instalacoes.map(inst => ({
      id: inst.id,
      nome_cliente: inst.nome_cliente,
      data_carregamento: inst.data_carregamento,
      hora: inst.hora_carregamento,
      tipo_carregamento: inst.tipo_carregamento,
      responsavel_carregamento_id: inst.responsavel_carregamento_id,
      responsavel_carregamento_nome: inst.responsavel_carregamento_nome,
      status: inst.status,
      // ... outros campos
      fonte: 'instalacoes',  // ← Importante!
    }));

    // 4. Combinar e retornar
    return [...ordensCarregamento, ...instalacoesNormalizadas];
  },
});
```

---

### Atualizacao do Tipo OrdemCarregamento

Adicionar campo `fonte` opcional ao tipo:

```typescript
// src/types/ordemCarregamento.ts
export interface OrdemCarregamento {
  // ... campos existentes
  fonte?: 'ordens_carregamento' | 'instalacoes';  // NOVO
}
```

---

### Fluxo Corrigido

```text
┌─────────────────────────────────────────────────────────────┐
│ FLUXO CORRIGIDO                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Modal: Agendar instalação para 28/01                        │
│        │                                                    │
│        ▼                                                    │
│ UPDATE instalacoes SET data_carregamento = '2026-01-28'     │
│        │                                                    │
│        ✓ Sucesso!                                           │
│                                                             │
│ Calendário: useOrdensCarregamentoCalendario                 │
│        │                                                    │
│        ▼                                                    │
│ SELECT * FROM ordens_carregamento WHERE data BETWEEN ...    │
│ SELECT * FROM instalacoes WHERE data BETWEEN ...            │
│        │                                                    │
│        ▼                                                    │
│ Combinar resultados + normalizar                            │
│        │                                                    │
│        ▼                                                    │
│ Calendário mostra entregas E instalações!                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Resultado Esperado

1. **Entregas** (tabela `ordens_carregamento`) continuam aparecendo no calendario
2. **Instalacoes agendadas** (tabela `instalacoes` com `data_carregamento` definida) agora tambem aparecem
3. Ambas as fontes sao exibidas corretamente com seus respectivos estilos (badges de "Entrega" vs "Instalacao")
4. O drag-and-drop continua funcionando com a `fonte` sendo passada corretamente para updates

