

## Plano: Reestruturar tabela de Pagamentos Autorizados

### Alterações

**Arquivo: `src/pages/logistica/AcordosAutorizados.tsx`**

1. **Reordenar e simplificar colunas** para:
   - **Portas** (badges P/G/GG)
   - **Cliente** (nome do cliente)
   - **Cidade** (cidade - estado)
   - **Data** (data do acordo)
   - **Valor** (valor acordado)
   - **Valor excesso** (diferença entre acordado e referência)
   - **Status** (badge pendente/em andamento/concluído)
   - Manter coluna **Ações** (menu dropdown editar/excluir) — sem ela perde-se a funcionalidade

2. **Remover colunas**: "Autorizado", "Criado por"

3. **Adicionar Tooltip na linha**: Ao fazer hover na row de cada acordo, exibir um `Tooltip` com os valores acordados por porta — lista detalhada de cada porta com tamanho e valor unitário.

### Detalhes técnicos
- Usar `TooltipProvider` + `Tooltip` + `TooltipTrigger` + `TooltipContent` já importados
- O tooltip será aplicado na célula de **Portas**, mostrando cada porta com seu tamanho e `valor_unitario` formatado
- Manter toda a lógica existente de filtros, CRUD e dialogs

### Arquivo impactado
- `src/pages/logistica/AcordosAutorizados.tsx`

