
## Plano: Criar Pagina de Edicao de Vendas Minimalista em /vendas/minhas-vendas

### Visao Geral

Replicar o sistema de edicao de vendas existente (`VendaEditarMinimalista.tsx`) para uma nova rota `/vendas/minhas-vendas/editar/:id`, mantendo o estilo minimalista azul da area de vendas. A pagina deve verificar se a venda esta faturada ou com pedido antes de permitir edicao, exibindo um dialog de bloqueio quando necessario.

---

### Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| `src/pages/vendas/MinhasVendasEditar.tsx` | Criar nova pagina de edicao |
| `src/pages/vendas/MinhasVendas.tsx` | Adicionar verificacao de faturamento e navegacao para edicao |
| `src/App.tsx` | Adicionar rota `/vendas/minhas-vendas/editar/:id` |

---

### Parte 1: Modificar MinhasVendas.tsx - Adicionar Logica de Edicao

Atualmente, ao clicar em uma venda na tabela, o sistema navega para `/dashboard/vendas/${venda.id}`. Vamos adicionar:

1. **Estado para o dialog de bloqueio**
2. **Funcao de verificacao antes de editar**
3. **Uso do VendaBloqueadaDialog**

**Mudancas:**

```typescript
// Novos imports
import { VendaBloqueadaDialog } from "@/components/vendas/VendaBloqueadaDialog";
import { BlockReason } from "@/hooks/useCanEditVenda";

// Novos estados
const [bloqueioDialogOpen, setBloqueioDialogOpen] = useState(false);
const [blockReason, setBlockReason] = useState<BlockReason>(null);
const [selectedVendaId, setSelectedVendaId] = useState<string | null>(null);

// Funcao de verificacao
const handleEditVenda = async (venda: Venda) => {
  try {
    // Verificar se e o proprietario
    const isOwner = venda.atendente_id === user?.id;
    if (!isOwner && !isAdmin) {
      setBlockReason('nao_proprietario');
      setBloqueioDialogOpen(true);
      return;
    }

    // Buscar dados de faturamento
    const { data: vendaData, error } = await supabase
      .from('vendas')
      .select('*, produtos_vendas(faturamento), frete_aprovado')
      .eq('id', venda.id)
      .single();

    if (error) throw error;

    const produtos = vendaData.produtos_vendas || [];
    const todosFaturados = produtos.length > 0 && 
      produtos.every((p: any) => p.faturamento === true);
    const freteAprovado = vendaData.frete_aprovado === true;
    const isFaturada = todosFaturados && freteAprovado;

    // Verificar pedido vinculado
    const { data: pedido } = await supabase
      .from('pedidos_producao')
      .select('id')
      .eq('venda_id', venda.id)
      .maybeSingle();

    const hasPedido = !!pedido;

    // Determinar bloqueio
    if (isFaturada && hasPedido) {
      setBlockReason('ambos');
      setBloqueioDialogOpen(true);
    } else if (isFaturada) {
      setBlockReason('faturada');
      setBloqueioDialogOpen(true);
    } else if (hasPedido) {
      setBlockReason('com_pedido');
      setBloqueioDialogOpen(true);
    } else {
      // Pode editar - navegar para pagina de edicao
      navigate(`/vendas/minhas-vendas/editar/${venda.id}`);
    }
  } catch (error) {
    console.error('Erro ao verificar permissoes:', error);
  }
};
```

**Atualizar o onClick da TableRow:**

```typescript
<TableRow 
  key={venda.id}
  className="border-blue-500/10 hover:bg-blue-500/10 cursor-pointer transition-colors"
  onClick={() => handleEditVenda(venda)}
>
```

**Adicionar o dialog ao final do componente:**

```typescript
<VendaBloqueadaDialog
  open={bloqueioDialogOpen}
  onOpenChange={setBloqueioDialogOpen}
  blockReason={blockReason}
/>
```

---

### Parte 2: Criar Pagina MinhasVendasEditar.tsx

Criar uma nova pagina baseada em `VendaEditarMinimalista.tsx` com o estilo azul minimalista consistente com a area de vendas.

**Principais diferencas do original:**

1. **Tema azul** - Usar `bg-gradient-to-br from-blue-500/5 to-blue-900/10` em vez de `bg-primary/5`
2. **Back path** - Apontar para `/vendas/minhas-vendas`
3. **Breadcrumb** - Home > Vendas > Minhas Vendas > Editar

**Estrutura do arquivo:**

```typescript
// src/pages/vendas/MinhasVendasEditar.tsx

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCanEditVenda, BlockReason } from "@/hooks/useCanEditVenda";
import { useToast } from "@/hooks/use-toast";
import { MinimalistLayout } from "@/components/MinimalistLayout";
import { VendaBloqueadaDialog } from "@/components/vendas/VendaBloqueadaDialog";
// ... demais imports

export default function MinhasVendasEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Verificacao de permissoes com o hook
  const { 
    canEdit, 
    loading: loadingPermission, 
    isFaturada, 
    hasPedido, 
    pedidoId,
    blockReason 
  } = useCanEditVenda({ vendaId: id });
  
  const [showBlockedDialog, setShowBlockedDialog] = useState(false);
  
  // Se nao pode editar, mostrar dialog
  useEffect(() => {
    if (!loadingPermission && !canEdit && blockReason) {
      setShowBlockedDialog(true);
    }
  }, [loadingPermission, canEdit, blockReason]);
  
  const handleBlockedDialogClose = (open: boolean) => {
    setShowBlockedDialog(open);
    if (!open) {
      navigate('/vendas/minhas-vendas');
    }
  };
  
  // ... resto da logica igual ao VendaEditarMinimalista
  
  const cardClass = "bg-gradient-to-br from-blue-500/5 to-blue-900/10 border-blue-500/20 backdrop-blur-xl";
  
  return (
    <MinimalistLayout 
      title="Editar Venda" 
      subtitle="Gerencie os produtos desta venda"
      backPath="/vendas/minhas-vendas"
      breadcrumbItems={[
        { label: "Home", path: "/home" },
        { label: "Vendas", path: "/vendas" },
        { label: "Minhas Vendas", path: "/vendas/minhas-vendas" },
        { label: "Editar" }
      ]}
    >
      {/* Dialog de bloqueio */}
      <VendaBloqueadaDialog
        open={showBlockedDialog}
        onOpenChange={handleBlockedDialogClose}
        blockReason={blockReason}
        pedidoId={pedidoId}
      />
      
      {/* Conteudo da pagina - igual ao VendaEditarMinimalista */}
      {/* ... */}
    </MinimalistLayout>
  );
}
```

**Estilos azuis consistentes:**

- Cards: `bg-gradient-to-br from-blue-500/5 to-blue-900/10 border-blue-500/20 backdrop-blur-xl`
- Textos label: `text-blue-300/70`
- Textos valor: `text-white`
- Bordas: `border-blue-500/20`
- Hover: `hover:bg-blue-500/10`
- Botao primario: `bg-gradient-to-r from-blue-500 to-blue-700`
- Botao secundario: `border-blue-500/30 text-blue-300 hover:bg-blue-500/10`

---

### Parte 3: Adicionar Rota no App.tsx

Adicionar a nova rota no grupo de rotas de vendas:

```typescript
// Importar o novo componente
import MinhasVendasEditar from '@/pages/vendas/MinhasVendasEditar';

// Adicionar rota apos /vendas/minhas-vendas/nova
<Route 
  path="/vendas/minhas-vendas/editar/:id" 
  element={
    <ProtectedRoute routeKey="vendas_hub">
      <MinhasVendasEditar />
    </ProtectedRoute>
  } 
/>
```

---

### Fluxo de Edicao Completo

```text
Usuario clica em venda na tabela
         |
         v
Verificar proprietario/admin
         |
    +----+----+
    |         |
  Nao        Sim
    |         |
    v         v
Dialog    Verificar faturamento
"Sem       e pedido
Permissao"    |
         +----+----+----+
         |    |    |    |
       Faturada  Pedido  Ambos  Nenhum
         |    |    |         |
         v    v    v         v
       Dialog de bloqueio   Navegar
       correspondente       para /editar/:id
```

---

### Funcionalidades da Pagina de Edicao

A pagina de edicao mantera todas as funcionalidades do `VendaEditarMinimalista.tsx`:

1. **Visualizacao de dados da venda** (somente leitura)
   - Cliente (nome, telefone, email, CPF)
   - Data da venda
   - Publico alvo e tipo de venda
   - Forma de pagamento
   - Tipo de entrega e frete
   - Endereco
   - Canal de aquisicao
   - Observacoes

2. **Gerenciamento de produtos**
   - Adicionar Porta de Enrolar
   - Adicionar Porta Social
   - Adicionar Pintura Eletrostatica
   - Adicionar Acessorios
   - Adicionar Adicionais
   - Adicionar Servico (Manutencao)
   - Adicionar do Catalogo

3. **Gerenciamento de descontos e creditos**
   - Modal de aplicacao de desconto
   - Modal de aplicacao de credito
   - Remocao de descontos

4. **Tabela de produtos**
   - Visualizacao dos produtos adicionados
   - Remocao de produtos
   - Remocao de descontos individuais

---

### Resumo das Mudancas

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `MinhasVendas.tsx` | Modificar | Adicionar verificacao de faturamento e dialog de bloqueio |
| `MinhasVendasEditar.tsx` | Criar | Nova pagina de edicao com estilo azul |
| `App.tsx` | Modificar | Adicionar rota `/vendas/minhas-vendas/editar/:id` |

---

### Resultado Esperado

1. Ao clicar em uma venda na tabela, o sistema verifica se pode editar
2. Se estiver faturada, com pedido, ou nao for proprietario: mostra dialog explicativo
3. Se puder editar: navega para `/vendas/minhas-vendas/editar/:id`
4. Pagina de edicao exibe dados da venda e permite gerenciar produtos
5. Estilo visual consistente com a area de vendas (tema azul minimalista)
6. Ao salvar, retorna para `/vendas/minhas-vendas`
