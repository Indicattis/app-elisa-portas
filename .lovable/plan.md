

# Remover tabela de precos e adicionar drag-and-drop nos estados

## Resumo

1. Remover a secao "Precos por Autorizado" da pagina `/direcao/autorizados`.
2. Adicionar coluna `ordem` na tabela `estados_autorizados` no banco de dados.
3. Implementar drag-and-drop nos cards de estados para reordenar suas posicoes, persistindo a ordem no banco.

## Detalhes tecnicos

### 1. Remover secao de precos

**Editar `src/pages/direcao/AutorizadosPrecosDirecao.tsx`**:
- Remover o import de `AutorizadosPrecosSection`.
- Remover o bloco `<AutorizadosPrecosSection />` dentro do grid de estados.
- O `div.space-y-8` que envolvia estados + precos pode ser simplificado.

### 2. Adicionar coluna `ordem` no banco

Executar migration SQL para adicionar a coluna `ordem` (integer, default 0) na tabela `estados_autorizados`. Isso permite persistir a ordem definida pelo usuario.

### 3. Implementar drag-and-drop nos estados

**Editar `src/hooks/useEstadosCidades.ts`**:
- Alterar o `fetchEstados` para ordenar por `ordem` ao inves de `sigla`.
- Adicionar funcao `reordenarEstados` que recebe o array reordenado e atualiza a coluna `ordem` de cada registro no banco.

**Editar `src/pages/direcao/AutorizadosPrecosDirecao.tsx`**:
- Importar componentes do `@dnd-kit/core` e `@dnd-kit/sortable` (ja instalados no projeto).
- Envolver o grid de estados com `DndContext` e `SortableContext`.
- Ao finalizar o drag (`onDragEnd`), reordenar o array local e chamar `reordenarEstados` para persistir.

**Editar `src/components/autorizados/EstadoCard.tsx`**:
- Criar um wrapper `SortableEstadoCard` que usa `useSortable` do dnd-kit para tornar cada card arrastavel.
- Aplicar os atributos de listeners e transform no card.

### Arquivos modificados

1. **SQL**: Adicionar coluna `ordem` em `estados_autorizados`
2. **Editar**: `src/pages/direcao/AutorizadosPrecosDirecao.tsx` -- remover precos, adicionar DndContext
3. **Editar**: `src/hooks/useEstadosCidades.ts` -- ordenar por `ordem`, adicionar `reordenarEstados`
4. **Editar**: `src/components/autorizados/EstadoCard.tsx` -- adicionar wrapper sortable

