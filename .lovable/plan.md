

## Plano: Coluna "Excesso" na tabela de Pagamentos Autorizados

### O que será feito

Adicionar uma coluna **"Excesso"** na tabela de acordos em `/logistica/pagamentos-autorizados` que mostra a diferença entre o `valor_acordado` e a soma dos `valor_unitario` das portas (valor de referência/permitido).

### Implementação

**Arquivo: `src/pages/logistica/AcordosAutorizados.tsx`**

1. Adicionar `<TableHead>` "Excesso" após a coluna "Valor"
2. Calcular o excesso por acordo: `valor_acordado - soma(portas.valor_unitario)`
3. Exibir o valor formatado com cor condicional:
   - **Verde** se excesso ≤ 0 (dentro do permitido)
   - **Vermelho** se excesso > 0 (acima do permitido)
4. Mostrar "—" se não houver portas cadastradas

