

# Comentários nos Pedidos (Downbar + Card)

## 1. Criar tabela `pedido_comentarios` (migração SQL)

```sql
CREATE TABLE public.pedido_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL,
  autor_nome TEXT NOT NULL,
  comentario TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pedido_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pedido_comentarios"
  ON public.pedido_comentarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert pedido_comentarios"
  ON public.pedido_comentarios FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_pedido_comentarios_pedido_id ON public.pedido_comentarios(pedido_id);
```

## 2. Adicionar seção de comentários na downbar (`PedidoDetalhesSheet.tsx`)

- Adicionar uma nova seção colapsável "Comentários" (com ícone `MessageSquare`) após o histórico de movimentações
- Dentro: lista de comentários existentes (autor, data, texto) + input para novo comentário
- Buscar comentários via `supabase.from('pedido_comentarios').select('*').eq('pedido_id', pedido.id).order('created_at', { ascending: false })`
- Inserir novo comentário usando o user autenticado (via `useAuth`)
- Recarregar lista após inserção

## 3. Mostrar último comentário no PedidoCard

Padrão igual às neos (descrição abaixo do nome do cliente):

- Na coluna do nome do cliente (Col 3), abaixo do `<h3>` com o nome, adicionar uma linha com o último comentário truncado (texto pequeno, `text-[9px] text-muted-foreground truncate`)
- Buscar o último comentário do pedido. Para evitar N+1, vou buscar de forma lazy ou via um state local no card que faz fetch ao montar
- Alternativa mais eficiente: adicionar campo `ultimo_comentario` na query principal dos pedidos via subquery ou fazer um batch fetch no componente pai. Como o padrão das neos usa `descricao` que já vem no objeto, a abordagem mais simples é fazer um fetch individual no PedidoCard (como já é feito para outros dados como ordens)

**Abordagem escolhida**: Fetch individual no PedidoCard com cache via estado, buscando apenas o último comentário por pedido_id.

## Arquivos alterados
- **Migração SQL**: nova tabela `pedido_comentarios`
- `src/components/pedidos/PedidoDetalhesSheet.tsx`: seção de comentários
- `src/components/pedidos/PedidoCard.tsx`: exibir último comentário abaixo do nome do cliente (ambas views list e grid)

