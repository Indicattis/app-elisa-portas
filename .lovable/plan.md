

## Plano: Adicionar quebra de etiquetas na Embalagem (como na Perfiladeira)

### Situação atual
- **Perfiladeira**: Usa geração inline de etiquetas com lógica de quebra (divisor), tanto por linha individual quanto "Imprimir Todas Etiquetas" via `handleImprimirTodasEtiquetas`.
- **Embalagem**: Usa o `ImprimirEtiquetasModal` genérico, sem a lógica de quebra por divisor/quantidade parcial.

### O que será feito

Alterar `OrdemDetalhesSheet.tsx` para que a **embalagem** também use a mesma lógica de etiquetas da perfiladeira:

1. **Botão "Imprimir Todas Etiquetas"**: Atualmente o botão de imprimir etiquetas em lote (modal) aparece quando `tipoOrdem !== 'perfiladeira'`. Mudar a condição para excluir também `embalagem`, e adicionar um botão "Imprimir Todas Etiquetas" (inline, como perfiladeira) para embalagem.

2. **Ajustar condição do modal**: O `ImprimirEtiquetasModal` (linhas 1157) será excluído também para embalagem: `tipoOrdem !== 'perfiladeira' && tipoOrdem !== 'embalagem'`.

3. **Botão "Imprimir Todas" para embalagem**: Na seção de cabeçalho dos itens (linha 798), adicionar o botão de "Imprimir Todas Etiquetas" (que chama `handleImprimirTodasEtiquetas`) quando `tipoOrdem === 'embalagem'`, igual já funciona para perfiladeira.

### Mudanças no arquivo

**`src/components/production/OrdemDetalhesSheet.tsx`**:
- Linha ~799: Mudar condição de `tipoOrdem !== 'perfiladeira'` para `tipoOrdem !== 'perfiladeira' && tipoOrdem !== 'embalagem'` (botão do modal).
- Adicionar botão "Imprimir Todas Etiquetas" para embalagem (chamando `handleImprimirTodasEtiquetas`), ao lado ou no lugar do botão do modal.
- Linha ~1157: Mudar condição do `ImprimirEtiquetasModal` para excluir embalagem também.

O botão individual de impressão por linha já funciona para embalagem (já existe para todos os tipos). A quebra de etiquetas com divisor já está implementada em `handleImprimirEtiqueta` e `handleImprimirTodasEtiquetas`.

