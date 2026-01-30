

# Plano: Conferencia do Estoque da Fabrica

## Objetivo

Criar um botao em `/producao/home` para conferencia do estoque da fabrica, onde o usuario informa a quantidade atual de cada item do estoque.

---

## Estrutura da Solucao

### 1. Banco de Dados - Nova Tabela

Criar a tabela `estoque_conferencias` para registrar as conferencias:

```sql
CREATE TABLE estoque_conferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferido_por UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  observacoes TEXT
);

CREATE TABLE estoque_conferencia_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conferencia_id UUID NOT NULL REFERENCES estoque_conferencias(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES estoque(id),
  quantidade_anterior INTEGER NOT NULL,
  quantidade_conferida INTEGER NOT NULL,
  diferenca INTEGER GENERATED ALWAYS AS (quantidade_conferida - quantidade_anterior) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices para performance
CREATE INDEX idx_estoque_conferencia_itens_conferencia ON estoque_conferencia_itens(conferencia_id);
CREATE INDEX idx_estoque_conferencia_itens_produto ON estoque_conferencia_itens(produto_id);

-- RLS Policies
ALTER TABLE estoque_conferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_conferencia_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver conferencias" ON estoque_conferencias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem criar conferencias" ON estoque_conferencias
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem ver itens" ON estoque_conferencia_itens
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados podem criar itens" ON estoque_conferencia_itens
  FOR INSERT TO authenticated WITH CHECK (true);
```

---

### 2. Nova Pagina - ConferenciaEstoqueFabrica.tsx

Criar pagina `/producao/conferencia-estoque` com fluxo:

1. **Lista de Produtos**: Tabela com todos os itens do estoque da fabrica
2. **Campos de Input**: Cada linha tera um campo para informar quantidade atual
3. **Comparacao Visual**: Mostrar quantidade no sistema vs quantidade conferida com indicador de diferenca
4. **Botao Finalizar**: Salva a conferencia e atualiza o estoque

**Layout:**
- Tabela com colunas: SKU, Produto, Categoria, Qtd Sistema, Qtd Conferida, Diferenca
- Campo de busca para filtrar produtos
- Botao "Finalizar Conferencia" que abre modal de confirmacao

---

### 3. Hook - useEstoqueConferencia.ts

```typescript
// Funcionalidades:
- Buscar todos os produtos do estoque (fabrica)
- Criar conferencia com todos os itens
- Atualizar quantidades no estoque apos conferencia
```

---

### 4. Alteracoes em ProducaoHome.tsx

Adicionar novo botao ao lado de "Meu Historico":

```tsx
<Button 
  variant="outline" 
  onClick={() => navigate('/producao/conferencia-estoque')}
>
  <ClipboardCheck className="h-4 w-4 mr-2" />
  Conferir Estoque
</Button>
```

---

### 5. Rota no App.tsx

Adicionar nova rota dentro do bloco de producao:

```tsx
<Route
  path="/conferencia-estoque"
  element={
    <ProtectedProducaoRoute>
      <ProducaoLayout>
        <ConferenciaEstoqueFabrica />
      </ProducaoLayout>
    </ProtectedProducaoRoute>
  }
/>
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/ConferenciaEstoqueFabrica.tsx` | Pagina principal da conferencia |
| `src/hooks/useEstoqueConferencia.ts` | Hook para gerenciar conferencias |
| `src/components/conferencia/ConferenciaItemRow.tsx` | Linha da tabela de conferencia |
| `supabase/migrations/xxx_create_estoque_conferencias.sql` | Migracao do banco |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/ProducaoHome.tsx` | Adicionar botao "Conferir Estoque" |
| `src/App.tsx` | Adicionar rota `/producao/conferencia-estoque` |

---

## Fluxo do Usuario

```text
1. Usuario acessa /producao/home
2. Clica no botao "Conferir Estoque"
3. Ve lista de todos os produtos do estoque da fabrica
4. Preenche a quantidade atual de cada item
5. Clica em "Finalizar Conferencia"
6. Sistema salva conferencia e atualiza quantidades no estoque
7. Usuario recebe confirmacao de sucesso
```

---

## Consideracoes Tecnicas

- A conferencia atualiza a tabela `estoque` com as novas quantidades
- Registra movimentacao em `estoque_movimentacoes` para historico
- Mostra diferenca visual (verde = aumento, vermelho = reducao)
- Permite campo de observacoes geral na conferencia
- Sao 95 itens ativos no estoque atualmente

