
## Plano: Corrigir Migracao de Dados - Etapa aguardando_instalacao para instalacoes

### Problema Identificado

A migracao anterior atualizou apenas a funcao RPC, mas **nao atualizou as constraints** das tabelas. Resultado:

- **5 pedidos** ainda estao em `aguardando_instalacao`
- **5 registros** em `pedidos_etapas` com etapa `aguardando_instalacao`
- **Constraints** ainda nao incluem `instalacoes` e `correcoes`

| Pedido | Cliente |
|--------|---------|
| 0138 | RICARDO STAUDT |
| 0116 | LLINAN INDUSTRIA DE MATERIAL PLASTICO LTDA |
| 0101 | Condominio Industrial Greentec |
| 0099 | FERNANDO FIGUEIRO LTDA |
| 0091 | BM CAR Recuperadora e Auto Peças Ltda |

---

### Solucao: Nova Migracao SQL

Criar uma migracao completa que:

#### Passo 1: Atualizar Constraint em pedidos_producao

```sql
-- Remover constraint antiga
ALTER TABLE pedidos_producao 
DROP CONSTRAINT IF EXISTS pedidos_producao_etapa_atual_check;

-- Adicionar nova constraint com todas as etapas validas
ALTER TABLE pedidos_producao 
ADD CONSTRAINT pedidos_producao_etapa_atual_check 
CHECK (etapa_atual IN (
  'aberto',
  'em_producao',
  'inspecao_qualidade', 
  'aguardando_pintura',
  'aguardando_coleta',
  'instalacoes',
  'correcoes',
  'finalizado'
));
```

#### Passo 2: Atualizar Constraint em pedidos_etapas

```sql
-- Remover constraint antiga
ALTER TABLE pedidos_etapas 
DROP CONSTRAINT IF EXISTS pedidos_etapas_etapa_check;

-- Adicionar nova constraint
ALTER TABLE pedidos_etapas 
ADD CONSTRAINT pedidos_etapas_etapa_check 
CHECK (etapa IN (
  'aberto',
  'em_producao', 
  'inspecao_qualidade',
  'aguardando_pintura',
  'aguardando_coleta',
  'instalacoes',
  'correcoes',
  'finalizado'
));
```

#### Passo 3: Migrar Dados dos Pedidos

```sql
-- Atualizar pedidos em aguardando_instalacao para instalacoes
UPDATE pedidos_producao 
SET etapa_atual = 'instalacoes',
    updated_at = now()
WHERE etapa_atual = 'aguardando_instalacao';

-- Atualizar registros em pedidos_etapas
UPDATE pedidos_etapas
SET etapa = 'instalacoes',
    updated_at = now()
WHERE etapa = 'aguardando_instalacao';
```

#### Passo 4: Garantir Ordens de Carregamento Corretas

```sql
-- Atualizar status das ordens de carregamento para instalacoes
UPDATE ordens_carregamento oc
SET status = CASE 
  WHEN oc.data_carregamento IS NOT NULL THEN 'agendada'
  ELSE 'pronta_fabrica'
END,
updated_at = now()
FROM vendas v
WHERE oc.venda_id = v.id 
AND v.tipo_entrega = 'instalacao'
AND oc.carregamento_concluido = false;
```

---

### Resultado Esperado

Apos a migracao:

1. Todos os 5 pedidos estarao na etapa `instalacoes`
2. Todos os registros em `pedidos_etapas` serao atualizados
3. As ordens de carregamento continuarao funcionando normalmente
4. Os pedidos aparecerao corretamente em `/producao/carregamento` e `/logistica/expedicao`

---

### Verificacao Pos-Migracao

Queries para confirmar sucesso:

```sql
-- Nao deve retornar resultados
SELECT * FROM pedidos_producao WHERE etapa_atual = 'aguardando_instalacao';

-- Nao deve retornar resultados  
SELECT * FROM pedidos_etapas WHERE etapa = 'aguardando_instalacao';

-- Deve retornar os 5 pedidos migrados
SELECT id, numero_pedido, etapa_atual FROM pedidos_producao 
WHERE id IN (
  'fd1d0188-0e9c-419e-945a-1c9a9e723aee',
  'ab8225d5-492c-43a5-9ba6-9a5b500b2b27',
  '901cd408-f032-4aaf-819d-361f8cab2fba',
  'e99f0197-5e99-45a9-b5f8-da752e369d38',
  'e03742bb-7807-4291-b531-dd27fafd04bf'
);
```
