

## Plano: Autocomplete de descrição no modal de gastos

### O que será feito
Quando o usuário digitar 1+ caractere no campo "Descrição" do modal de novo/editar gasto, o sistema buscará descrições já cadastradas em outros gastos e exibirá sugestões clicáveis abaixo do campo.

### Alteração

**`src/pages/administrativo/GastosPage.tsx`**

1. Extrair lista de descrições únicas dos gastos já carregados (`gastos` do hook `useGastos`), filtrando valores nulos/vazios.

2. Criar estado `sugestoes` e lógica de filtragem: quando `descricao` tiver 1+ caracteres, filtrar descrições que contenham o texto digitado (case-insensitive), limitando a ~5 resultados.

3. Substituir o `<Input>` de descrição por um wrapper com posição relativa, mantendo o input mas adicionando abaixo dele um dropdown de sugestões (div absoluto com lista de opções clicáveis).

4. Ao clicar numa sugestão, preencher o campo `descricao` e fechar o dropdown.

5. Fechar o dropdown ao perder foco (onBlur com pequeno delay para permitir clique).

### Detalhes técnicos
- As sugestões virão dos gastos já carregados em memória (`gastos.map(g => g.descricao).filter(Boolean)` → `Set` para únicos).
- Sem consultas adicionais ao banco — os dados já estão disponíveis no hook.
- Estilo do dropdown: `bg-[#1a1a1a] border border-white/20 rounded` consistente com o modal.

