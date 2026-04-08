

## Plano: Permitir edição de dados do cliente no rascunho de venda

### Contexto
Atualmente, a seção "Dados da Venda" em `/vendas/minhas-vendas/editar/:id` exibe os dados do cliente (nome, telefone, email, CPF) e endereço (cidade, estado, bairro, CEP) como somente leitura. O usuário precisa editá-los quando a venda é rascunho (`is_rascunho = true`).

### Alterações

**`src/pages/vendas/MinhasVendasEditar.tsx`**

1. Adicionar estados para controlar o modo de edição dos dados do cliente (ex: `editandoCliente`)
2. Quando `venda.is_rascunho`, exibir um botão "Editar" ao lado do título "Cliente" e "Endereço"
3. Ao clicar, trocar os `<p>` por inputs editáveis para:
   - **Cliente**: nome, telefone, email, CPF
   - **Endereço**: estado, cidade, bairro, CEP
4. Adicionar botão "Salvar" que faz `supabase.from('vendas').update(...)` com os campos editados e atualiza o estado local `venda`
5. Condicionar a edição apenas quando `venda.is_rascunho === true`

### Campos editáveis
| Campo | Coluna na tabela `vendas` |
|-------|--------------------------|
| Nome | `cliente_nome` |
| Telefone | `cliente_telefone` |
| Email | `cliente_email` |
| CPF | `cpf_cliente` |
| Estado | `estado` |
| Cidade | `cidade` |
| Bairro | `bairro` |
| CEP | `cep` |

### UX
- Inline editing: ao clicar no ícone de edição, os textos se tornam inputs com estilo consistente (bg-blue-500/10, border-blue-500/20)
- Botão "Salvar alterações" aparece quando há mudanças
- Ao salvar, os inputs voltam a ser texto estático
- Se não for rascunho, mantém o comportamento atual (somente leitura)

### Arquivo alterado
- `src/pages/vendas/MinhasVendasEditar.tsx`

