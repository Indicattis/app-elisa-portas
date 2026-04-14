

## Plano: Separar medidas individuais para portas expandidas

### Problema
O produto `47b3b686` tem `quantidade=2`, gerando duas portas virtuais (#2 e #3). Ambas apontam para o mesmo registro no banco. Ao salvar medidas de uma, o `UPDATE` usa `_originalId`, alterando o registro compartilhado e afetando as duas.

### Solução
Ao editar medidas de uma porta que pertence a um grupo com `quantidade > 1`, o sistema deve **dividir** ("split") o registro original em registros individuais antes de salvar. Isso garante que cada porta tenha seu próprio registro no `produtos_vendas`.

### Alterações

**1. `src/components/pedidos/MedidasPortasSection.tsx`**

Modificar `handleSalvar` para detectar quando a porta pertence a um grupo (`_totalNoGrupo > 1`):

- **Se `_totalNoGrupo > 1`**: Fazer o split do registro original:
  1. Reduzir a `quantidade` do registro original em 1 (ex: de 2 para 1)
  2. Inserir um novo registro em `produtos_vendas` copiando todos os campos do original, com `quantidade=1` e as novas medidas
  3. Se a quantidade restante do original ficar em 0, deletar o original
  4. Atualizar o estado local e invalidar as queries para refletir a mudança
  
- **Se `_totalNoGrupo === 1`**: Manter o comportamento atual (update simples)

### Lógica do split (pseudocódigo)

```text
Se porta._totalNoGrupo > 1:
  1. UPDATE produtos_vendas SET quantidade = quantidade - 1 WHERE id = _originalId
  2. INSERT INTO produtos_vendas (todos os campos copiados, quantidade=1, novas medidas)
  3. Invalidar queries
  4. Se quantidade original era 1 após decremento (ficou 0), DELETE original
```

### Resultado
- Cada porta pode ter medidas independentes
- Portas com mesmas medidas continuam agrupadas até serem editadas individualmente
- O split é transparente para o usuário -- ele simplesmente edita e salva

