
## Plano: Unificar Ordens - Instalação com Funcionalidade de Carregamento Integrada

### Problema Atual

Atualmente, para pedidos de instalação/manutenção, o sistema cria **duas ordens**:
1. `ordens_carregamento` - Para o processo de carregamento
2. `instalacoes` - Para o processo de instalação

Isso é redundante porque a tabela `instalacoes` **já possui** todos os campos de carregamento:
- `data_carregamento`, `hora_carregamento`
- `tipo_carregamento` (elisa, autorizados, terceiro)
- `responsavel_carregamento_id`, `responsavel_carregamento_nome`
- `carregamento_concluido`, `carregamento_concluido_em`, `carregamento_concluido_por`

---

### Solução Proposta

| Tipo de Entrega | Tabela Utilizada | Aparece em |
|-----------------|------------------|------------|
| `entrega` | `ordens_carregamento` | `/producao/carregamento`, `/logistica/expedicao` |
| `instalacao` | `instalacoes` | `/producao/carregamento`, `/logistica/expedicao`, `/logistica/instalacoes` |
| `manutencao` | `instalacoes` | `/producao/carregamento`, `/logistica/expedicao`, `/logistica/instalacoes` |

---

### Parte 1: Modificar `/producao/carregamento` para Exibir Ambas as Fontes

#### 1.1 Criar Hook Unificado: `useOrdensCarregamentoUnificadas.ts`

Este hook busca dados de ambas as tabelas e retorna uma lista unificada:

```typescript
export interface OrdemCarregamentoUnificada {
  id: string;
  fonte: 'ordens_carregamento' | 'instalacoes';
  pedido_id: string | null;
  venda_id: string | null;
  nome_cliente: string;
  data_carregamento: string | null;
  hora_carregamento: string | null;
  tipo_carregamento: 'elisa' | 'autorizados' | 'terceiro' | null;
  responsavel_carregamento_id: string | null;
  responsavel_carregamento_nome: string | null;
  carregamento_concluido: boolean;
  status: string;
  tipo_entrega: 'entrega' | 'instalacao' | 'manutencao';
  // ... outros campos comuns
}
```

**Lógica:**
```typescript
// Buscar ordens de carregamento (apenas entregas)
const ordensEntrega = await supabase
  .from('ordens_carregamento')
  .select('*, venda:vendas(...)')
  .eq('carregamento_concluido', false);

// Buscar instalações (instalação/manutenção)
const ordensInstalacao = await supabase
  .from('instalacoes')
  .select('*, venda:vendas(...), pedido:pedidos_producao(...)')
  .eq('carregamento_concluido', false)
  .in('pedido.etapa_atual', ['instalacoes']);

// Combinar e normalizar para interface unificada
return [...ordensEntrega, ...ordensInstalacao].map(normalizar);
```

#### 1.2 Atualizar `CarregamentoMinimalista.tsx` e `CarregamentoKanban.tsx`

- Usar o novo hook unificado
- Adaptar a lógica de conclusão para chamar a função correta baseada na `fonte`

---

### Parte 2: Modificar `/logistica/expedicao` para Gerenciar Ambas as Fontes

O calendário de expedição já usa `useOrdensCarregamentoInstalacao.ts`. Este hook precisará:

1. **Para instalações**: Atualizar campos na tabela `instalacoes`
2. **Para entregas**: Continuar atualizando `ordens_carregamento`

---

### Parte 3: Remover Criação Duplicada de `ordens_carregamento`

#### 3.1 Modificar `usePedidosEtapas.ts`

**Antes (ao avançar para `instalacoes`):**
```typescript
// Cria ordem em ordens_carregamento (REMOVER)
await supabase.from('ordens_carregamento').insert({...});
```

**Depois:**
```typescript
// Apenas atualiza status da instalação existente
// A instalação já foi criada ao avançar para em_producao
await supabase
  .from('instalacoes')
  .update({ 
    status: 'pronta_fabrica',
    // Campos de carregamento serão preenchidos em /logistica/expedicao
  })
  .eq('pedido_id', pedidoId);
```

#### 3.2 Modificar `usePedidoCreation.ts`

**Para manutenção:** Criar apenas `instalacoes`, não criar `ordens_carregamento`

---

### Parte 4: Atualizar Função RPC para Conclusão de Carregamento

#### 4.1 Nova Função: `concluir_carregamento_instalacao`

```sql
CREATE OR REPLACE FUNCTION concluir_carregamento_instalacao(p_instalacao_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas marcar carregamento como concluído
  -- NÃO avançar pedido para finalizado
  -- O pedido permanece em 'instalacoes' até finalização manual
  
  UPDATE instalacoes
  SET carregamento_concluido = true,
      carregamento_concluido_em = now(),
      carregamento_concluido_por = auth.uid(),
      updated_at = now()
  WHERE id = p_instalacao_id;
END;
$$;
```

#### 4.2 Modificar RPC Existente

A função `concluir_carregamento_e_avancar_pedido` continua sendo usada apenas para `ordens_carregamento` (entregas).

---

### Parte 5: Limpar Dados Duplicados (Migração)

Remover `ordens_carregamento` redundantes para pedidos de instalação onde já existe registro em `instalacoes`:

```sql
-- Identificar ordens duplicadas
DELETE FROM ordens_carregamento oc
WHERE EXISTS (
  SELECT 1 FROM instalacoes i 
  WHERE i.pedido_id = oc.pedido_id
)
AND oc.carregamento_concluido = false;
```

---

### Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useOrdensCarregamentoUnificadas.ts` | **Criar** | Hook que busca de ambas tabelas |
| `src/hooks/usePedidosEtapas.ts` | Modificar | Remover criação de `ordens_carregamento` para instalações |
| `src/hooks/usePedidoCreation.ts` | Modificar | Remover criação de `ordens_carregamento` para manutenção |
| `src/pages/fabrica/producao/CarregamentoMinimalista.tsx` | Modificar | Usar hook unificado |
| `src/components/carregamento/CarregamentoKanban.tsx` | Modificar | Adaptar para tipo unificado |
| `src/components/carregamento/CarregamentoDownbar.tsx` | Modificar | Lógica de conclusão por fonte |
| Nova migração SQL | Criar | Função RPC + limpeza de dados |

---

### Fluxo Visual Resultante

```text
VENDA FATURADA (tipo_entrega = instalacao/manutencao)
       |
       v
PEDIDO CRIADO → Cria apenas em 'instalacoes'
       |
       v
[... etapas de produção ...]
       |
       v
ETAPA: INSTALACOES
       |
       v
Status instalacao: 'pronta_fabrica'
       |
       v
/logistica/expedicao → Agenda data_carregamento na tabela 'instalacoes'
       |
       v
/producao/carregamento → Exibe instalações com data_carregamento
       |
       v
Concluir Carregamento → Marca carregamento_concluido = true
                      → Pedido PERMANECE em 'instalacoes'
       |
       v
/logistica/instalacoes → Concluir Instalação OU Mover para Correções
       |
       v
FINALIZADO
```

---

### Benefícios da Unificação

1. **Menos redundância**: Uma única fonte de verdade para instalações
2. **Dados centralizados**: Informações de carregamento e instalação na mesma tabela
3. **Código mais simples**: Menos joins e sincronizações entre tabelas
4. **Histórico completo**: Todo o ciclo de vida da instalação em um registro
