

# Criar pagina dedicada de cadastro de colaborador

## Resumo
Substituir o modal `AddColaboradorDialog` por uma pagina dedicada em `/administrativo/rh-dp/colaboradores/novo`. O botao "Adicionar Colaborador" passara a navegar para essa nova pagina em vez de abrir um modal.

## Alteracoes

### 1. Nova pagina: `src/pages/administrativo/rh-dp/NovoColaborador.tsx`
- Usar `MinimalistLayout` com breadcrumbs (RH/DP > Colaboradores > Novo Colaborador) e `backPath` apontando para `/administrativo/rh-dp/colaboradores`
- Reutilizar toda a logica de formulario do `AddColaboradorDialog` (validacao Zod, formatacao de CPF/moeda, chamada a edge function `create-user`)
- Layout em card centralizado com campos organizados em grid
- Apos sucesso, redirecionar automaticamente para `/administrativo/rh-dp/colaboradores` com toast de confirmacao

### 2. Editar: `src/pages/administrativo/ColaboradoresMinimalista.tsx`
- Remover import do `AddColaboradorDialog`
- Substituir o componente `<AddColaboradorDialog>` por um `<Button>` com `onClick={() => navigate('/administrativo/rh-dp/colaboradores/novo')}`
- Manter o icone `UserPlus` e texto "Adicionar Colaborador"

### 3. Editar: `src/App.tsx`
- Adicionar import do `NovoColaborador`
- Registrar a rota `/administrativo/rh-dp/colaboradores/novo` com `ProtectedRoute` usando a mesma `routeKey` ("administrativo_hub")

## Detalhes tecnicos

A nova pagina tera os mesmos campos do modal atual:
- Nome, Email, Senha (padrao "mudar123"), CPF
- Funcao (select dinamico da tabela `system_roles`), Setor
- Salario, Modalidade de pagamento, Em folha de pagamento (switch)

A validacao Zod e as funcoes de formatacao (`formatCPF`, `formatCurrency`, `parseCurrency`) serao mantidas identicas. O submit continuara chamando a edge function `create-user` com `eh_colaborador: true`.

### Arquivos afetados
- **Novo:** `src/pages/administrativo/rh-dp/NovoColaborador.tsx`
- **Editado:** `src/pages/administrativo/ColaboradoresMinimalista.tsx`
- **Editado:** `src/App.tsx`

