

## Plano: Nova página "Pedidos Pagos sem Data de Entrega"

### O que será feito

1. Criar tabela `pedidos_pagos_sem_entrega` no Supabase
2. Criar página de listagem e cadastro em `/logistica/pedidos-sem-entrega`
3. Adicionar botão no hub de logística

### 1. Migração — tabela `pedidos_pagos_sem_entrega`

```sql
CREATE TABLE public.pedidos_pagos_sem_entrega (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT NOT NULL,
  estado TEXT NOT NULL,
  cidade TEXT NOT NULL,
  valor_pago NUMERIC(12,2) NOT NULL DEFAULT 0,
  portas_p INTEGER NOT NULL DEFAULT 0,
  portas_g INTEGER NOT NULL DEFAULT 0,
  portas_gg INTEGER NOT NULL DEFAULT 0,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.pedidos_pagos_sem_entrega ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage" ON public.pedidos_pagos_sem_entrega
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 2. Nova página `src/pages/logistica/PedidosPagosSemEntrega.tsx`

- Header com botão voltar para `/logistica`
- Botão "Novo Cadastro" abre dialog/modal com formulário:
  - Cliente (input text)
  - Estado e Cidade (inputs text)
  - Valor Pago (input number, formatado R$)
  - Portas P, G, GG (inputs number)
  - Descrição (textarea)
- Tabela listando registros existentes com colunas: Cliente, Local (cidade/estado), Valor, Portas (P/G/GG), Descrição, Data
- Botão excluir por registro

### 3. Ajustes em arquivos existentes

- **`LogisticaHub.tsx`**: Adicionar item `{ label: "Pedidos s/ Entrega", icon: AlertCircle, path: "/logistica/pedidos-sem-entrega" }` ao array `menuItems`
- **`App.tsx`**: Adicionar rota `<Route path="/logistica/pedidos-sem-entrega" element={<ProtectedRoute routeKey="logistica_hub"><PedidosPagosSemEntrega /></ProtectedRoute>} />`

