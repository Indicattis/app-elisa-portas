
# Plano: Aprovacoes de Venda com Requisicao de Desconto

## O que sera feito

Duas partes:

1. **Hub de Aprovacoes**: Adicionar botao "Aprovacoes Vendas" em `/direcao/aprovacoes` levando a nova rota `/direcao/aprovacoes/vendas`
2. **Pagina de Aprovacoes de Vendas**: Lista requisicoes de venda pendentes com opcao de aprovar (criando a venda efetivamente) ou recusar
3. **Modal de Autorizacao**: No `AutorizacaoDescontoModal`, adicionar opcao "Solicitar Aprovacao" como alternativa a senha, que salva a requisicao no banco e avisa o usuario que a venda sera criada quando aprovada

---

## Detalhes Tecnicos

### 1. Tabela `requisicoes_aprovacao_venda` (nova)

Armazena todos os dados necessarios para recriar a venda quando aprovada:

```sql
CREATE TABLE requisicoes_aprovacao_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID NOT NULL REFERENCES admin_users(user_id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
  -- Dados snapshot da venda
  dados_venda JSONB NOT NULL,         -- VendaFormData serializado
  dados_produtos JSONB NOT NULL,      -- ProdutoVenda[] serializado
  dados_pagamento JSONB,              -- PagamentoData serializado
  dados_credito JSONB,                -- CreditoVenda serializado
  -- Desconto info
  percentual_desconto NUMERIC NOT NULL,
  tipo_autorizacao TEXT NOT NULL,
  -- Resultado
  aprovado_por UUID REFERENCES admin_users(user_id),
  venda_id UUID REFERENCES vendas(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE requisicoes_aprovacao_venda ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode criar requisicao
CREATE POLICY "Autenticados podem criar requisicoes" ON requisicoes_aprovacao_venda
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admins podem ver e atualizar todas
CREATE POLICY "Admins podem ver todas" ON requisicoes_aprovacao_venda
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'administrador' OR bypass_permissions = true))
    OR solicitante_id = auth.uid()
  );

CREATE POLICY "Admins podem atualizar" ON requisicoes_aprovacao_venda
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'administrador' OR bypass_permissions = true))
  );
```

### 2. Modificar `AutorizacaoDescontoModal.tsx`

Adicionar um botao "Solicitar Aprovacao" no footer do modal, ao lado de "Autorizar". Ao clicar:
- Recebe uma nova prop `onSolicitarAprovacao` que sera chamada
- O modal fecha e o vendedor recebe feedback de que a requisicao foi criada

Nova prop:
```typescript
interface AutorizacaoDescontoModalProps {
  // ... existentes
  onSolicitarAprovacao?: () => void; // Nova
}
```

### 3. Modificar `VendasNova.tsx`

No `handleSubmit`, quando o desconto requer autorizacao e o usuario escolhe "Solicitar Aprovacao":
- Salvar todos os dados da venda como JSONB na tabela `requisicoes_aprovacao_venda`
- Mostrar toast de sucesso e navegar para a lista de vendas
- Nao criar a venda ainda

Nova funcao `handleSolicitarAprovacao`:
```typescript
const handleSolicitarAprovacao = async () => {
  // Inserir na tabela requisicoes_aprovacao_venda com status 'pendente'
  // Snapshot completo: formData, portas, pagamentoData, creditoVenda
  await supabase.from('requisicoes_aprovacao_venda').insert({...});
  toast.success('Requisicao de aprovacao criada!');
  navigate('/dashboard/vendas');
};
```

### 4. Nova pagina `AprovacoesVendas.tsx`

Design identico ao `AprovacoesProducao.tsx` (mobile-first, cards expandiveis):

```text
+------------------------------------------+
| [<] Aprovacoes Vendas          [Refresh] |
|     X requisicoes aguardando             |
+------------------------------------------+
| [Card: Nome cliente]                     |
|   Vendedor: Joao | Desconto: 12.5%      |
|   Valor: R$ 15.000 | Data: 05/02        |
|   [v expandir]                           |
|                                          |
|   [Detalhes dos produtos]               |
|   [Aprovar Venda] [Recusar]             |
+------------------------------------------+
```

Ao aprovar:
- Chamar `createVenda` do `useVendas` com os dados salvos no JSONB
- Atualizar status para `aprovada` e salvar `venda_id` e `aprovado_por`
- Chamar tambem o registro de autorizacao de desconto

Ao recusar:
- Atualizar status para `recusada`

### 5. Hub de Aprovacoes (`DirecaoAprovacoesHub.tsx`)

Adicionar entrada no `menuItems`:
```typescript
{ label: 'Aprovacoes Vendas', icon: ShoppingCart, path: '/direcao/aprovacoes/vendas' }
```

Adicionar query de contagem de pendentes.

### 6. Rota no `App.tsx`

```typescript
<Route path="/direcao/aprovacoes/vendas" element={
  <ProtectedRoute routeKey="direcao_hub"><AprovacoesVendas /></ProtectedRoute>
} />
```

### Arquivos criados/modificados

1. **SQL**: Tabela `requisicoes_aprovacao_venda` + RLS
2. **Criar**: `src/pages/direcao/aprovacoes/AprovacoesVendas.tsx`
3. **Criar**: `src/hooks/useRequisicaoAprovacaoVenda.ts` - hook para CRUD
4. **Modificar**: `src/components/vendas/AutorizacaoDescontoModal.tsx` - botao "Solicitar Aprovacao"
5. **Modificar**: `src/pages/VendasNova.tsx` - handler de solicitar aprovacao
6. **Modificar**: `src/pages/direcao/aprovacoes/DirecaoAprovacoesHub.tsx` - novo botao + contagem
7. **Modificar**: `src/App.tsx` - nova rota
