

## Plano: Sistema de Comentários na Downbar de Vendas Pendentes

### Resumo
Criar uma tabela `venda_comentarios` (similar a `pedido_comentarios`) e adicionar a seção de comentários na `VendaPendenteDetalhesSheet`, replicando o visual e comportamento dos comentários dos pedidos.

### Mudanças

**1. Migration: criar tabela `venda_comentarios`**
```sql
CREATE TABLE public.venda_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL,
  autor_nome text NOT NULL,
  comentario text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.venda_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage venda_comentarios"
  ON public.venda_comentarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**2. `src/components/pedidos/VendaPendenteDetalhesSheet.tsx`**
- Adicionar states: `comentariosOpen`, `comentarios`, `novoComentario`, `enviandoComentario`
- Adicionar `fetchComentarios` para buscar de `venda_comentarios`
- Adicionar `handleEnviarComentario` usando `useAuth` para obter `userRole`
- Adicionar seção Collapsible de comentários (ícone `MessageSquare`, input + lista) idêntica ao `PedidoDetalhesSheet`
- Importar `useAuth`, `MessageSquare`, `Input`, `Send`

### Arquivos alterados
- Nova migration SQL
- `src/components/pedidos/VendaPendenteDetalhesSheet.tsx`

