

# Plano: Exibir Informacoes de Agendamento nas Ordens de Carregamento e Instalacao

## Objetivo

Mostrar data, hora e nome do responsavel (equipe/veiculo/autorizado) nas badges de carregamento e instalacao no card de pedido.

## Mudancas Necessarias

### 1. Expandir Interface OrdemStatus

**Arquivo:** `src/hooks/useOrdensPorPedido.ts`

Adicionar novos campos na interface `OrdemStatus`:

```typescript
export interface OrdemStatus {
  // ... campos existentes
  
  // Novos campos para agendamento (carregamento/instalacao)
  data_agendamento: string | null;
  hora_agendamento: string | null;
  responsavel_nome: string | null;
  tipo_responsavel: 'elisa' | 'autorizados' | 'terceiro' | null;
}
```

### 2. Atualizar Query de Carregamento

**Arquivo:** `src/hooks/useOrdensPorPedido.ts` (linhas 167-170)

```typescript
// ANTES
supabase
  .from('ordens_carregamento')
  .select('id, pedido_id, status, responsavel_carregamento_id, data_carregamento, carregamento_concluido')

// DEPOIS
supabase
  .from('ordens_carregamento')
  .select('id, pedido_id, status, responsavel_carregamento_id, responsavel_carregamento_nome, tipo_carregamento, data_carregamento, hora_carregamento, carregamento_concluido')
```

### 3. Atualizar Query de Instalacao

**Arquivo:** `src/hooks/useOrdensPorPedido.ts` (linhas 171-174)

```typescript
// ANTES
supabase
  .from('instalacoes')
  .select('id, pedido_id, status, responsavel_instalacao_id, responsavel_carregamento_id, data_instalacao, instalacao_concluida, carregamento_concluido')

// DEPOIS
supabase
  .from('instalacoes')
  .select('id, pedido_id, status, responsavel_instalacao_id, responsavel_instalacao_nome, tipo_instalacao, data_instalacao, hora, instalacao_concluida')
```

### 4. Processar Dados no Mapeamento

**Arquivo:** `src/hooks/useOrdensPorPedido.ts` (linhas 280-302)

Incluir os novos campos ao processar carregamento e instalacao:

```typescript
// Carregamento
ordensMap[ordem.pedido_id]['carregamento'] = {
  ...ordem,
  responsavel_id: ordem.responsavel_carregamento_id,
  responsavel_nome: ordem.responsavel_carregamento_nome,
  tipo_responsavel: ordem.tipo_carregamento,
  data_agendamento: ordem.data_carregamento,
  hora_agendamento: ordem.hora_carregamento,
  status: ordem.carregamento_concluido ? 'concluido' : (ordem.data_carregamento ? 'agendado' : 'pendente'),
};

// Instalacao
ordensMap[ordem.pedido_id]['instalacao'] = {
  ...ordem,
  responsavel_id: ordem.responsavel_instalacao_id,
  responsavel_nome: ordem.responsavel_instalacao_nome,
  tipo_responsavel: ordem.tipo_instalacao,
  data_agendamento: ordem.data_instalacao,
  hora_agendamento: ordem.hora,
  status: ordem.instalacao_concluida ? 'concluido' : (ordem.data_instalacao ? 'agendado' : 'pendente'),
};
```

### 5. Atualizar criarOrdemStatus

**Arquivo:** `src/hooks/useOrdensPorPedido.ts` (linhas 382-411)

Adicionar os novos campos no retorno:

```typescript
return {
  // ... campos existentes
  data_agendamento: ordem?.data_agendamento || null,
  hora_agendamento: ordem?.hora_agendamento || null,
  responsavel_nome: ordem?.responsavel_nome || null,
  tipo_responsavel: ordem?.tipo_responsavel || null,
};
```

### 6. Atualizar UI no PedidoOrdemCard

**Arquivo:** `src/components/fabrica/PedidoOrdemCard.tsx`

Mostrar informacoes de agendamento para ordens de carregamento/instalacao:

```tsx
{/* Dentro do botao de ordem */}
<div className="flex flex-col items-start gap-0.5 min-w-0">
  <span className="font-medium text-xs">{ORDEM_LABELS[ordem.tipo]}</span>
  <span className="text-[10px] opacity-80">
    {ordem.pausada ? 'Pausada' : (ordem.existe ? getStatusLabel(ordem.status) : 'Sem ordem')}
  </span>
  
  {/* Novo: Informacoes de agendamento para carregamento/instalacao */}
  {(ordem.tipo === 'carregamento' || ordem.tipo === 'instalacao') && ordem.data_agendamento && (
    <div className="flex flex-col gap-0.5 mt-0.5">
      <span className="text-[9px] opacity-70">
        {format(new Date(ordem.data_agendamento + 'T00:00:00'), 'dd/MM')}
        {ordem.hora_agendamento && ` ${ordem.hora_agendamento.slice(0, 5)}`}
      </span>
      {ordem.responsavel_nome && (
        <span className="text-[9px] opacity-70 truncate max-w-[100px]">
          {ordem.responsavel_nome}
        </span>
      )}
    </div>
  )}
</div>
```

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useOrdensPorPedido.ts` | Expandir interface, queries e mapeamento |
| `src/components/fabrica/PedidoOrdemCard.tsx` | Exibir data, hora e responsavel |

## Resultado Esperado

As badges de Carregamento e Instalacao mostrarao:
- **Status**: Pendente / Agendado / Concluido
- **Data**: formato dd/MM (ex: 15/01)
- **Hora**: formato HH:mm (ex: 08:00)
- **Responsavel**: Nome da equipe, veiculo ou autorizado

