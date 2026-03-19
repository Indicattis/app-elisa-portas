

## Plano: Painel de Produção Read-Only no Administrativo

### Resumo

Criar uma nova pagina `/administrativo/producao` que exibe os pedidos por etapa (igual `/direcao/gestao-fabrica`) mas somente para visualizacao, sem acoes de mover, reorganizar, arquivar ou deletar. Abaixo dos pedidos, exibir uma tabela com os itens (`linhas_ordens`) nao concluidos agrupados por etapa.

### Arquivos a criar/modificar

**1. `src/pages/administrativo/ProducaoAdminReadOnly.tsx`** (Novo)
- Usa `MinimalistLayout` com breadcrumb `Home > Administrativo > Produção`
- Reutiliza `usePedidosContadores` e `usePedidosEtapas` para exibir pedidos por etapa em tabs (mesmo layout de tabs com grupos coloridos do GestaoFabricaDirecao)
- Renderiza `PedidosDraggableList` com `enableDragAndDrop={false}` e sem callbacks de mover/retroceder/arquivar/deletar (passando `undefined`)
- Sem botoes de "Pedido Teste", atribuir responsavel, calendarios, etc.
- Inclui filtros basicos (busca por nome/numero)
- Abaixo das tabs, nova secao **"Itens por Etapa"**: busca `linhas_ordens` com `concluida = false`, juntando com `pedidos_producao` para obter a `etapa_atual`. Agrupa itens por etapa e exibe em tabela com colunas: Item, Quantidade, Tamanho, Pedido (numero), Etapa

**2. `src/hooks/useItensNaoConcluidosPorEtapa.ts`** (Novo)
- Hook que busca `linhas_ordens` onde `concluida = false`
- Join com `pedidos_producao` via `pedido_id` para obter `etapa_atual` e `numero_pedido`
- Join com `estoque` via `estoque_id` para nome do produto
- Retorna dados agrupados por etapa

**3. `src/pages/administrativo/AdministrativoHub.tsx`** (Modificar)
- Adicionar item: `{ label: "Produção", icon: Factory, path: "/administrativo/producao", ativo: true }`

**4. `src/App.tsx`** (Modificar)
- Registrar rota `/administrativo/producao` → `ProducaoAdminReadOnly`

### Detalhes tecnicos

- A secao de itens usara uma query Supabase com select aninhado:
  ```sql
  linhas_ordens(id, item, quantidade, tamanho, largura, altura, concluida, tipo_ordem,
    estoque:estoque_id(nome_produto),
    pedidos_producao:pedido_id(numero_pedido, etapa_atual)
  ) where concluida = false
  ```
- Itens serao exibidos em um `Collapsible` por etapa, com contador de itens pendentes
- Tabela usa componentes `Table` existentes do projeto
- Nenhuma migracao de banco necessaria

