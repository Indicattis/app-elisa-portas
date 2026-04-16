

## Correção: Validação de desconto ao cadastrar venda a partir de rascunho

### Problema
Na página de edição de rascunho (`MinhasVendasEditar.tsx`), o botão "Cadastrar Venda" converte o rascunho em venda sem verificar os limites de desconto. Isso permite que vendedores burlem o sistema: adicionam desconto acima do limite, salvam como rascunho, e depois cadastram sem que a senha seja exigida.

### Solução
Adicionar a mesma lógica de validação de desconto que existe em `VendaNovaMinimalista.tsx`:

**Arquivo: `src/pages/vendas/MinhasVendasEditar.tsx`**

1. **Imports**: Adicionar `validarDesconto`, `getTipoAutorizacaoNecessaria`, `ConfigLimites` de `descontoVendasRules`, `useConfiguracoesVendas`, e os componentes de modal de autorização (`AutorizacaoDescontoModal` ou `VerificacaoLiderModal` + `SenhaMasterModal`).

2. **Estado**: Adicionar states para controlar o modal de autorização (`autorizacaoDescontoOpen`, `tipoAutorizacaoNecessaria`, `descontoAutorizado`).

3. **Validação no `handleCadastrarVenda`**: Antes de fazer o update, chamar `validarDesconto(produtosFormatados, venda.forma_pagamento, venda.venda_presencial, configLimites)`. Se o desconto exceder o limite e não tiver sido autorizado, abrir o modal de senha e bloquear o cadastro.

4. **Callback de autorização**: Quando a senha for confirmada, marcar `descontoAutorizado = true` e prosseguir com o cadastro.

5. **Renderizar o modal de autorização** no JSX, da mesma forma que é feito em `VendaNovaMinimalista.tsx`.

### Resultado