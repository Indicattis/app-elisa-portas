
# Adicionar filtro de Autorizados no Cronograma de Instalacoes

## O que sera feito
Adicionar uma secao "Filtrar por Autorizados" no menu lateral (Sheet) do cronograma, logo abaixo do filtro de equipes existente. Autorizados selecionados aparecerao como linhas adicionais na grid semanal e como filtro na visao mensal, no mesmo formato visual das equipes.

## Alteracoes

### Arquivo: `src/pages/CronogramaInstalacoes.tsx`

1. **Importar `useAutorizadosAptos`** do hook existente para buscar a lista de autorizados ativos/premium.

2. **Adicionar estado `autorizadosSelecionados`** (`useState<string[]>([])`) para rastrear quais autorizados estao filtrados, seguindo o mesmo padrao de `equipesSelecionadas`.

3. **Criar lista `autorizadosFiltrados`** que mapeia os autorizados selecionados para o mesmo formato de "equipe" (com `id`, `nome`, `cor`) para que possam ser renderizados como linhas na grid. Cor padrao dos autorizados: `#f59e0b` (amber) para diferenciar visualmente das equipes internas.

4. **Combinar `equipesFiltradas` + `autorizadosFiltrados`** em uma unica lista `responsaveisFiltrados` que sera passada como prop `equipesFiltradas` para `CronogramaInstalacao` e `CronogramaInstalacaoMensal`.

5. **Adicionar secao no Sheet** entre o filtro de equipes e as acoes:
   - Separator
   - Label "Filtrar por Autorizados"
   - Botao "Limpar" (condicional)
   - Lista de checkboxes com nome do autorizado e bolinha amber
   - Segue o mesmo padrao visual do filtro de equipes

6. **Atualizar `limparFiltros`** para tambem limpar `autorizadosSelecionados`.

### Detalhes tecnicos

```text
Estado:
  equipesSelecionadas: string[]        (existente)
  autorizadosSelecionados: string[]    (novo)

Dados:
  equipes <- useEquipesInstalacao()           (existente)
  autorizados <- useAutorizadosAptos()        (novo)

Filtro combinado:
  equipesFiltradas = equipesSelecionadas.length > 0 ? equipes.filter(...) : equipes
  autorizadosFiltrados = autorizadosSelecionados.map(id => ({
    id, nome, cor: '#f59e0b', ativa: true, ...
  }))
  
  // Se nenhum filtro ativo: so equipes (comportamento atual)
  // Se equipes filtradas: equipes selecionadas + autorizados selecionados
  // Se autorizados filtrados: equipes (todas ou filtradas) + autorizados selecionados
  responsaveisFiltrados = [...equipesFiltradas, ...autorizadosFiltrados]
```

A grid semanal ja renderiza linhas baseadas em `equipesFiltradas`, entao autorizados aparecerao automaticamente como linhas extras com a cor amber. Ordens atribuidas a um autorizado (`responsavel_carregamento_id` = autorizado.id) aparecerao na linha correspondente.

### Arquivo unico editado
- `src/pages/CronogramaInstalacoes.tsx`
