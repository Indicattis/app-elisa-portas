

## Plano: Corrigir Status da Instalação ao Agendar no Calendário

### Problema Identificado

Ao agendar uma instalação via calendário em `/logistica/expedicao`, o `status` permanece como `pendente_producao` mesmo quando o pedido já está pronto na produção (etapa = `instalacoes`).

**Causa raiz:** A mutation de update em `useOrdensCarregamentoCalendario.ts` (linhas 190-200) não inclui o campo `status` quando atualiza instalações.

```text
Dados atuais no banco:
- instalacao.id: 42383ee9-ae43-4ec7-9d69-4c6e06d15841
- nome_cliente: FERNANDO FIGUEIRO LTDA
- status: pendente_producao  ← Deveria ser 'agendada' ou 'pronta_fabrica'
- data_carregamento: 2026-01-28
- pedido.etapa_atual: instalacoes  ← Produção já concluída!
```

---

### Arquivo a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useOrdensCarregamentoCalendario.ts` | Modificar | Adicionar `status: 'agendada'` no update de instalações |

---

### Mudança Proposta

**Antes (linhas 190-200):**
```typescript
if (fonte === 'instalacoes') {
  const { error } = await supabase
    .from("instalacoes")
    .update({
      data_carregamento: data.data_carregamento,
      hora_carregamento: data.hora,
      tipo_carregamento: data.tipo_carregamento,
      responsavel_carregamento_id: data.responsavel_carregamento_id,
      responsavel_carregamento_nome: data.responsavel_carregamento_nome,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw error;
}
```

**Depois:**
```typescript
if (fonte === 'instalacoes') {
  const { error } = await supabase
    .from("instalacoes")
    .update({
      data_carregamento: data.data_carregamento,
      hora_carregamento: data.hora,
      tipo_carregamento: data.tipo_carregamento,
      responsavel_carregamento_id: data.responsavel_carregamento_id,
      responsavel_carregamento_nome: data.responsavel_carregamento_nome,
      status: 'agendada',  // NOVO: Atualizar status para 'agendada'
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw error;
}
```

---

### Fluxo Corrigido

```text
┌──────────────────────────────────────────────────────────────┐
│ ANTES (COM PROBLEMA)                                         │
├──────────────────────────────────────────────────────────────┤
│ Agendar instalação → UPDATE sem status                       │
│ status permanece: 'pendente_producao'                        │
│ Em /producao/carregamento → mostra como pendente             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ DEPOIS (CORRIGIDO)                                           │
├──────────────────────────────────────────────────────────────┤
│ Agendar instalação → UPDATE com status: 'agendada'           │
│ status atualiza: 'agendada'                                  │
│ Em /producao/carregamento → mostra corretamente como agendada│
└──────────────────────────────────────────────────────────────┘
```

---

### Consideração Adicional

A instalação recém-agendada (FERNANDO FIGUEIRO LTDA) que está com status incorreto precisará de uma correção manual via SQL para corrigir o dado existente:

```sql
UPDATE instalacoes 
SET status = 'agendada' 
WHERE data_carregamento IS NOT NULL 
  AND status = 'pendente_producao';
```

Isso pode ser feito após a implementação do fix no código.

---

### Resultado Esperado

1. Novos agendamentos de instalação atualizam o `status` para `'agendada'`
2. Em `/producao/carregamento`, instalações agendadas exibem corretamente "Agendada" no badge
3. Dados existentes podem ser corrigidos via SQL

