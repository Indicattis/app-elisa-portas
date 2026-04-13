

## Plano: Sincronizar rotas de permissões com todas as rotas do site

### Problema
A tabela `app_routes` está desatualizada em relação às rotas reais do `App.tsx`. Muitas rotas existentes no código não aparecem na tela de permissões, e diversas sub-rotas compartilham a mesma permissão do hub pai (ex: `direcao_hub`), impedindo controle granular.

### Rotas faltando na tabela `app_routes`

**Fábrica** (2 rotas):
- `fabrica_embalagem` — /fabrica/producao/embalagem
- `fabrica_arquivo_morto` — /fabrica/arquivo-morto

**Direção** (8 rotas):
- `direcao_dre` — /direcao/dre
- `direcao_autorizados` — /direcao/autorizados
- `direcao_aprovacoes` — /direcao/aprovacoes
- `direcao_checklist` — /direcao/checklist-lideranca
- `direcao_gestao_colaboradores` — /direcao/gestao-colaboradores
- `direcao_metas_instalacoes` — /direcao/metas/instalacoes
- `direcao_regras_vendas` — /direcao/vendas/regras-vendas
- `direcao_tabela_precos` — /direcao/vendas/tabela-precos

**Logística** (3 rotas):
- `logistica_autorizados` — /logistica/autorizados
- `logistica_pedidos_sem_entrega` — /logistica/pedidos-sem-entrega
- `logistica_ranking` — /logistica/instalacoes/ranking

**Administrativo** (8 rotas):
- `admin_multas` — /administrativo/multas
- `admin_gastos` — /administrativo/financeiro/gastos
- `admin_bancos` — /administrativo/financeiro/bancos
- `admin_rh_dp_vagas` — /administrativo/rh-dp/vagas
- `admin_rh_dp_responsabilidades` — /administrativo/rh-dp/responsabilidades
- `admin_rh_dp_funcoes` — /administrativo/rh-dp/funcoes
- `admin_rh_dp_folha` — /administrativo/rh-dp/colaboradores/folha-pagamento

**Estoque** (2 rotas):
- `estoque_conferencia` — /estoque/conferencia
- `estoque_auditoria` — /estoque/auditoria

**Marketing** (1 rota):
- `marketing_conversoes` — /marketing/conversoes

### Ações

1. **Migration SQL** — Inserir ~24 novas rotas em `app_routes` com `interface = 'padrao'`, `parent_key` correto e `sort_order` adequado.

2. **Atualizar `App.tsx`** — Trocar `routeKey="direcao_hub"` / `routeKey="logistica_hub"` / `routeKey="administrativo_hub"` pelas chaves granulares nas rotas que agora têm entrada própria.

3. **Propagar permissões existentes** — Na mesma migration, copiar `user_route_access` de quem já tem acesso ao hub pai para as novas sub-rotas, evitando que usuários percam acesso.

### Arquivos alterados
- Nova migration SQL
- `src/App.tsx` — routeKeys atualizados (~20 linhas)

