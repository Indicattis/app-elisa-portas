

# Grid de Meses + Pagina de Custos Mensais

## Objetivo

Transformar a pagina `/administrativo/financeiro/custos` para exibir:
1. Um grid 3 colunas com os 12 meses do ano (similar ao FaturamentoMensalGrid)
2. Ao clicar num mes, navegar para `/administrativo/financeiro/custos/:mes` onde o usuario cadastra valores reais para cada tipo de custo configurado

A pagina atual de configuracao de tipos de custos sera movida para um botao "Configurar Tipos de Custos" acessivel dentro da nova pagina.

## Mudancas

### 1. Nova tabela `custos_mensais` (migracao SQL)

Tabela para armazenar os valores reais de cada tipo de custo por mes:

```sql
CREATE TABLE custos_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes DATE NOT NULL,              -- primeiro dia do mes (ex: 2026-01-01)
  tipo_custo_id UUID NOT NULL REFERENCES tipos_custos(id) ON DELETE CASCADE,
  valor_real NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mes, tipo_custo_id)
);

ALTER TABLE custos_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver custos_mensais"
  ON custos_mensais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem inserir custos_mensais"
  ON custos_mensais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados podem atualizar custos_mensais"
  ON custos_mensais FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados podem deletar custos_mensais"
  ON custos_mensais FOR DELETE TO authenticated USING (true);
```

### 2. Novo hook `src/hooks/useCustosMensais.ts`

Hook para buscar/salvar custos mensais de um mes especifico:
- `fetchCustosMes(mes)` - busca todos custos_mensais do mes com join em tipos_custos
- `saveCustoMensal(tipo_custo_id, mes, valor_real, observacoes)` - upsert (insert ou update baseado na constraint unique)
- `getTotaisPorMes()` - retorna soma dos valores reais por mes para o grid

### 3. Refatorar `src/pages/administrativo/CustosMinimalista.tsx` - Grid de Meses

A pagina atual sera refatorada para:
- Exibir um grid 3x4 com os 12 meses do ano
- Cada card mostra: nome do mes, total de custos lancados, total do limite
- Mes atual destacado (estilo similar ao FaturamentoMensalGrid)
- Botao "Configurar Tipos de Custos" no header para acessar a configuracao
- Ao clicar num mes, navega para `/administrativo/financeiro/custos/:mes`

### 4. Nova pagina `src/pages/administrativo/CustosMesMinimalista.tsx`

Pagina de custos do mes selecionado:
- Recebe o parametro `:mes` da URL (formato `2026-01`)
- Lista todos os tipos de custos ativos, agrupados por categoria
- Para cada tipo de custo: mostra nome, valor maximo mensal, campo para valor real e observacoes
- Botao salvar para fazer upsert dos valores
- Cards resumo: total lancado, total limite, percentual utilizado
- Breadcrumb: Home > Administrativo > Financeiro > Custos > Janeiro 2026

### 5. Nova rota no `src/App.tsx`

Adicionar rota:
```
/administrativo/financeiro/custos/configurar -> CustosMinimalista atual (renomeado)
/administrativo/financeiro/custos/:mes -> CustosMesMinimalista (nova)
/administrativo/financeiro/custos -> CustosGridMinimalista (novo grid de meses)
```

## Arquivos

1. **Migracao SQL** - criar tabela `custos_mensais`
2. **`src/hooks/useCustosMensais.ts`** - novo hook para CRUD de custos mensais
3. **`src/pages/administrativo/CustosGridMinimalista.tsx`** - nova pagina com grid de meses (substitui a rota `/custos`)
4. **`src/pages/administrativo/CustosMesMinimalista.tsx`** - nova pagina para cadastrar custos do mes
5. **`src/App.tsx`** - adicionar novas rotas
6. **`src/pages/administrativo/CustosMinimalista.tsx`** - manter como pagina de configuracao, acessada via `/custos/configurar`

