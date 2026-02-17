

# Sistema de Transferir Pedidos Finalizados para Correção

## Resumo
Implementar o fluxo onde pedidos na etapa "finalizado" so podem ser arquivados ou enviados para correção. O envio para correção cria uma nova entidade na tabela `correcoes` (similar a `instalacoes`) que pode ser agendada no calendario de expedição. Ao concluir a correção, o pedido retorna para "finalizado".

## O que muda para o usuario
- Na etapa "finalizado", os botoes de retroceder e gerar pedido de correção sao removidos
- Restam apenas dois botoes: **Arquivar** e **Enviar para Correção**
- Ao clicar em "Enviar para Correção", um modal de confirmação simples aparece
- O pedido move para a etapa "correcoes" e uma ordem de correção e criada
- A correção aparece na listagem de serviços pendentes em `/logistica/expedicao` para agendamento
- A correção aparece no calendario de expedição quando agendada
- Ao concluir a correção, o pedido volta automaticamente para "finalizado"

## Alterações tecnicas

### 1. Migração SQL - Criar tabela `correcoes`

Nova tabela `correcoes` com estrutura similar a `instalacoes`:

```text
correcoes
├── id (uuid PK)
├── pedido_id (uuid FK -> pedidos_producao)
├── venda_id (uuid FK -> vendas)
├── nome_cliente (text)
├── data_correcao (date, nullable)
├── hora (text, default '08:00')
├── responsavel_correcao_id (uuid, nullable)
├── responsavel_correcao_nome (text, nullable)
├── status (text: 'pendente', 'agendada', 'finalizada')
├── concluida (boolean, default false)
├── concluida_em (timestamptz, nullable)
├── concluida_por (uuid, nullable)
├── observacoes (text, nullable)
├── data_carregamento (date, nullable)
├── hora_carregamento (time, nullable)
├── responsavel_carregamento_id (uuid, nullable)
├── responsavel_carregamento_nome (text, nullable)
├── carregamento_concluido (boolean, default false)
├── endereco, cidade, estado, cep, telefone_cliente (text)
├── vezes_agendado (integer, default 0)
├── created_at, updated_at (timestamptz)
├── created_by (uuid)
└── tipo_carregamento (tipo_carregamento, default 'elisa')
```

RLS: habilitar com politica permissiva para usuarios autenticados.

### 2. `src/components/pedidos/PedidoCard.tsx` - Remover botoes e adicionar enviar correção

**Remover na etapa finalizado:**
- Botao de retroceder (linhas ~1495-1500 e ~1997-2001): adicionar condição `etapaAtual !== 'finalizado'` no `podeRetroceder`
- Botao de gerar correção (linhas ~1527-1548): remover 'finalizado' da lista `etapasCorrecao`

**Adicionar na etapa finalizado (layout desktop, linhas ~1619-1625 e layout mobile, linhas ~1976-1992):**
- Botao "Enviar para Correção" com icone `Wrench` e estilo roxo, ao lado do botao de arquivar
- State `showEnviarCorrecao` e modal de confirmação

**Novo modal:** `EnviarCorrecaoModal.tsx` - modal simples de confirmação ("Deseja enviar este pedido para a etapa de correção?")

### 3. `src/hooks/useCorrecoes.ts` - Novo hook

Criar hook similar a `useNeoInstalacoes.ts`:
- `useCorrecoes(currentDate, viewType)`: buscar correções agendadas para o calendario
- `useCorrecoesSemData()`: buscar correções pendentes de agendamento
- Mutations: `updateCorrecao`, `concluirCorrecao` (ao concluir, mover pedido de volta para 'finalizado')
- `agendarCorrecao(id, data)`: atualizar data_correcao

### 4. `src/hooks/useEnviarParaCorrecao.ts` - Hook de envio

Mutation que:
1. Move o pedido da etapa 'finalizado' para 'correcoes' (fecha etapa finalizado, cria/upsert etapa correcoes)
2. Cria registro na tabela `correcoes` com dados do pedido/venda (cliente, endereco, etc.)
3. Registra movimentação em `pedidos_movimentacoes`

### 5. `src/components/expedicao/NeoServicosDisponiveis.tsx` - Adicionar correções

Na listagem de serviços pendentes de agendamento:
- Receber prop `correcoes` (array de correções sem data)
- Mapear correções para o mesmo formato de serviço avulso com tipo `'correcao_pedido'`
- Botao de agendar e editar para cada correção
- Icone diferenciado (ex: `Wrench` laranja) para distinguir de neo_correcao

### 6. `src/components/expedicao/CalendarioMensalExpedicaoDesktop.tsx` e `CalendarioSemanalExpedicaoDesktop.tsx`

- Receber prop `correcoes` e renderizar no calendario (cor distinta, ex: laranja/vermelho)
- Ao clicar, abrir detalhes da correção
- Suportar drag-and-drop para reagendamento

### 7. `src/pages/logistica/ExpedicaoMinimalista.tsx` - Integrar correções

- Importar e usar hooks `useCorrecoes` e `useCorrecoesSemData`
- Passar correções para os componentes de calendario e listagem
- Handlers de agendar, editar e concluir correção

### 8. `src/types/correcao.ts` - Novo tipo TypeScript

Interface `Correcao` com todos os campos da tabela.

### 9. Fluxo de conclusão da correção

No hook `useCorrecoes`, ao concluir:
1. Marcar `concluida: true`, `concluida_em`, `concluida_por`
2. Mover pedido de 'correcoes' de volta para 'finalizado' (fechar etapa correcoes, reabrir/upsert etapa finalizado)
3. Atualizar `etapa_atual` do pedido para 'finalizado'
4. Registrar movimentação

### Arquivos envolvidos
- **Novo:** Migração SQL (tabela `correcoes`)
- **Novo:** `src/types/correcao.ts`
- **Novo:** `src/hooks/useCorrecoes.ts`
- **Novo:** `src/hooks/useEnviarParaCorrecao.ts`
- **Novo:** `src/components/pedidos/EnviarCorrecaoModal.tsx`
- **Editar:** `src/components/pedidos/PedidoCard.tsx` (remover botoes, adicionar enviar correção)
- **Editar:** `src/components/expedicao/NeoServicosDisponiveis.tsx` (adicionar correções na listagem)
- **Editar:** `src/components/expedicao/NeoServicosDisponiveisMobile.tsx` (idem mobile)
- **Editar:** `src/components/expedicao/CalendarioMensalExpedicaoDesktop.tsx` (renderizar correções)
- **Editar:** `src/components/expedicao/CalendarioSemanalExpedicaoDesktop.tsx` (renderizar correções)
- **Editar:** `src/pages/logistica/ExpedicaoMinimalista.tsx` (integrar hooks e handlers)

