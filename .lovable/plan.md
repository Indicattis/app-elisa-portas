

## Painel de Metas de Vendas com Tiers

Adicionar um novo painel em `/paineis/metas-vendas` que mostra o progresso de cada vendedor em relação a metas semanais ou mensais, com **tiers** (níveis) que liberam bonificações ao serem atingidos. A configuração das metas vive em uma nova página em `/direcao/metas/vendas` (hoje "em desenvolvimento" no hub).

### Modelo de dados (novas tabelas)

**`metas_vendas`** (configuração da meta — uma por período + alvo)
| coluna | tipo | obs |
|---|---|---|
| `id` | uuid PK | |
| `nome` | text | rótulo (ex.: "Meta Semanal Equipe") |
| `periodo` | text | `'semanal'` ou `'mensal'` |
| `escopo` | text | `'individual'` (cada vendedor tem a mesma meta) ou `'global'` (soma de todos) |
| `vendedor_id` | uuid null | se preenchido, meta exclusiva daquele vendedor |
| `data_inicio_vigencia` | date | a partir de quando vale; semanas/meses se renovam automaticamente |
| `data_fim_vigencia` | date null | opcional; sem isso, vigora indefinidamente |
| `ativa` | boolean default true | |
| `created_by`, `created_at`, `updated_at` | | |

**`metas_vendas_tiers`** (níveis de cada meta)
| coluna | tipo | obs |
|---|---|---|
| `id` | uuid PK | |
| `meta_id` | uuid FK → `metas_vendas` ON DELETE CASCADE | |
| `ordem` | int | 1, 2, 3... |
| `nome` | text | ex.: "Bronze", "Prata", "Ouro" |
| `valor_alvo` | numeric | R$ a atingir no período |
| `bonificacao_tipo` | text | `'fixo'` ou `'percentual'` |
| `bonificacao_valor` | numeric | R$ se fixo, % do total vendido se percentual |
| `cor` | text default `'#3B82F6'` | cor da barra/badge |

**RLS**: leitura para autenticados; escrita restrita via `has_role(uid,'admin'::user_role)` (Direção/Admin), seguindo o padrão `has_role` com cast `::user_role` (memória do projeto).

### Cálculo do período corrente

- `semanal`: período corrente = segunda-feira da semana atual 00:00 → domingo 23:59 (timezone local, com sufixo `T12:00:00.000Z` no DB conforme regra do projeto).
- `mensal`: período corrente = dia 1 do mês 00:00 → último dia 23:59.

Soma de vendas no período: `vendas` onde `is_rascunho = false`, `data_venda` no intervalo, agrupado por `atendente_id` (individual) ou somando todas (global). Usar `valor_venda`.

### Nova página: `/direcao/metas/vendas`

Acessada pelo botão **Vendas** do `MetasHubDirecao` (já existe, hoje desabilitado — ativar `ativo: true` e apontar para `/direcao/metas/vendas`).

Layout (estilo `MinimalistLayout`, padrão glassmorphism do projeto):
- Cabeçalho com título "Metas de Vendas" + botão **Nova Meta**.
- Lista de metas ativas, cada card mostra: nome, período (semanal/mensal), escopo, vigência, e os tiers em uma régua horizontal com cor e valor.
- Ações por meta: **Editar**, **Duplicar**, **Desativar/Excluir**.

Modal **Nova/Editar Meta**:
1. Nome
2. Período (radio: Semanal / Mensal)
3. Escopo (radio: Individual / Global) + seletor opcional de Vendedor (filtra `admin_users` com tipo `representante`/colaborador de vendas)
4. Vigência (data início, data fim opcional)
5. **Tiers** — lista dinâmica (adicionar/remover), cada linha:
   - Nome, Valor alvo (R$), Tipo de bonificação (Fixo R$ / % do vendido), Valor da bonificação, Cor
   - Ordenação automática por `valor_alvo` ascendente

Validações: ao menos 1 tier; valores crescentes; bonificação > 0.

### Novo painel: `/paineis/metas-vendas`

Adicionar:
1. Rota em `src/App.tsx` dentro do bloco `/paineis` protegida por `routeKey="paineis_metas_vendas"`.
2. Card no `PaineisHome.tsx` (ícone `Target`, cor amber/yellow) e mapeamento em `routeKeyMap`.
3. Inserir registro em `app_routes` (`interface='paineis'`, `key='paineis_metas_vendas'`, `path='/paineis/metas-vendas'`, `icon='Target'`).

**Conteúdo da página** (componente `PaineisMetasVendas.tsx`):

Cabeçalho compacto: período corrente formatado ("Semana de 21/04 a 27/04" ou "Abril 2026") + total vendido no período.

Para cada meta ativa cuja vigência inclui hoje, renderizar um **bloco-barra retangular** com tiers:

```text
┌────────────────────────────────────────────────────────────────┐
│  Meta Semanal — Vendedor: João         R$ 18.430 / R$ 30.000   │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░       │
│  ▲Bronze 10k  ▲Prata 20k    ▲Ouro 30k    △Diamante 50k         │
│   ✔ +R$200    ○ +R$500      ○ +2%        ○ +R$2.000            │
└────────────────────────────────────────────────────────────────┘
```

Especificação visual:
- Container `rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4` (padrão do projeto).
- Barra retangular `h-6 rounded-md` com fundo `bg-white/5`. Preenchimento gradiente que **muda de cor ao cruzar cada tier** (cor do tier alcançado mais alto).
- Marcadores de tier posicionados em `left: (tier.valor_alvo / max_alvo) * 100%`, com triângulo + valor abaixo + bonificação.
- Tier alcançado: ícone `CheckCircle`, badge "Liberado", valor da bonificação calculado (se `%`, aplicar sobre o vendido atual).
- Tier não alcançado: ícone vazio, opacidade reduzida.
- Animação de crescimento ao montar (transition width 800ms ease-out).

Listagem: para metas `escopo='individual'`, renderizar uma barra **por vendedor com vendas no período** (ordenado por valor desc). Para `escopo='global'`, uma barra única somando tudo.

Refresh automático a cada 30s (`refetchInterval: 30000`) para refletir vendas em tempo real.

### Hooks e utilitários

- `src/hooks/useMetasVendas.ts` — CRUD de metas + tiers (admin).
- `src/hooks/useProgressoMetasVendas.ts` — calcula período corrente, busca vendas agregadas e devolve `{ meta, tiers, vendedores: [{vendedor_id, nome, total_vendido, tier_atingido, bonificacao_calculada}] }`.
- `src/lib/periodoMeta.ts` — funções `getInicioFimSemana()` e `getInicioFimMes()` respeitando `T12:00:00.000Z` (regra de timezone do projeto).

### Permissões

- `paineis_metas_vendas` adicionada em `app_routes` com `interface='paineis'`. Acesso controlado via `user_route_access` como os demais painéis.
- Página `/direcao/metas/vendas` herda controle existente de Direção (sem mudança de RLS além das tabelas novas).

### Arquivos a criar / editar

**Criar**
- `src/pages/direcao/MetasVendasDirecao.tsx`
- `src/components/metas-vendas/MetaVendasFormDialog.tsx`
- `src/components/metas-vendas/TierEditor.tsx`
- `src/pages/paineis/PaineisMetasVendas.tsx`
- `src/components/paineis/MetaVendasBarra.tsx`
- `src/hooks/useMetasVendas.ts`
- `src/hooks/useProgressoMetasVendas.ts`
- `src/lib/periodoMeta.ts`

**Editar**
- `src/App.tsx` — registrar `/direcao/metas/vendas` e `/paineis/metas-vendas`
- `src/pages/direcao/MetasHubDirecao.tsx` — ativar item "Vendas"
- `src/pages/PaineisHome.tsx` — novo card + entrada em `routeKeyMap`

**Migrações SQL**
- Criar `metas_vendas` e `metas_vendas_tiers` com RLS
- Inserir rota `paineis_metas_vendas` em `app_routes`

### Fora de escopo

- Pagamento/registro contábil das bonificações (apenas exibido).
- Histórico de períodos passados (apenas período corrente; pode ser plano futuro).
- Notificações/alertas ao atingir tier.

