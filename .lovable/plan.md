

# Página de Detalhes do Cliente em /vendas/meus-clientes/:id

## Problema
Ao clicar em um cliente na lista, o `navigate` vai para `/dashboard/clientes` (rota inexistente ou errada), voltando à home.

## Solução

### 1. Criar nova página `src/pages/vendas/MeuClienteDetalhe.tsx`
- Recebe `:id` via URL params
- Busca dados do cliente na tabela `clientes` (filtrando por `created_by = user.id`)
- Busca vendas do cliente na tabela `vendas` (filtrando por `cliente_id`)
- Layout com `MinimalistLayout`, breadcrumb: Home > Vendas > Meus Clientes > Nome do Cliente

**Seções da página:**
- **Card de informações do cliente**: nome, CPF/CNPJ, telefone, email, endereço, cidade/estado, tipo (CE/CR), badges fidelizado/parceiro, observações
- **Botão "Editar"**: abre modal com `ClienteForm` pré-preenchido (reutilizando o componente existente + `useUpdateCliente`)
- **Tabela de vendas**: lista as vendas do cliente com data, valor, status

### 2. Registrar rota no App.tsx
```
/vendas/meus-clientes/:id → <MeuClienteDetalhe />
```

### 3. Corrigir navegação em MeusClientes.tsx
```tsx
// De:
onClick={() => navigate(`/dashboard/clientes`)}
// Para:
onClick={() => navigate(`/vendas/meus-clientes/${cliente.id}`)}
```

### Arquivos
- **Criar**: `src/pages/vendas/MeuClienteDetalhe.tsx`
- **Editar**: `src/App.tsx` (adicionar rota)
- **Editar**: `src/pages/vendas/MeusClientes.tsx` (corrigir navigate)

