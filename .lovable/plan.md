
# Plano: Adicionar Colunas de Métricas de Desempenho às Ordens de Produção

## Objetivo

Adicionar colunas para armazenar métricas de desempenho em cada tipo de ordem de produção, permitindo análise e relatórios de produtividade.

---

## Colunas a Adicionar

| Tabela | Nova Coluna | Tipo | Descrição |
|--------|-------------|------|-----------|
| `ordens_separacao` | `quantidade_itens` | `INTEGER` | Quantidade de linhas/itens na ordem |
| `ordens_qualidade` | `quantidade_pedidos` | `INTEGER DEFAULT 1` | Sempre 1 (referência ao pedido) |
| `ordens_carregamento` | `quantidade_pedidos` | `INTEGER DEFAULT 1` | Sempre 1 (referência ao pedido) |
| `instalacoes` | `metragem_quadrada` | `DECIMAL(10,2)` | Total m² das portas (largura × altura) |
| `ordens_soldagem` | `metragem_quadrada` | `DECIMAL(10,2)` | Total m² das portas (largura × altura) |

---

## Migração SQL

```sql
-- Adicionar coluna quantidade_itens em ordens_separacao
ALTER TABLE ordens_separacao 
ADD COLUMN IF NOT EXISTS quantidade_itens INTEGER;

-- Adicionar coluna quantidade_pedidos em ordens_qualidade (sempre 1)
ALTER TABLE ordens_qualidade 
ADD COLUMN IF NOT EXISTS quantidade_pedidos INTEGER DEFAULT 1;

-- Adicionar coluna quantidade_pedidos em ordens_carregamento (sempre 1)
ALTER TABLE ordens_carregamento 
ADD COLUMN IF NOT EXISTS quantidade_pedidos INTEGER DEFAULT 1;

-- Adicionar coluna metragem_quadrada em instalacoes
ALTER TABLE instalacoes 
ADD COLUMN IF NOT EXISTS metragem_quadrada DECIMAL(10,2);

-- Adicionar coluna metragem_quadrada em ordens_soldagem
ALTER TABLE ordens_soldagem 
ADD COLUMN IF NOT EXISTS metragem_quadrada DECIMAL(10,2);

-- Adicionar comentários para documentação
COMMENT ON COLUMN ordens_separacao.quantidade_itens IS 'Quantidade de itens/linhas na ordem de separação';
COMMENT ON COLUMN ordens_qualidade.quantidade_pedidos IS 'Quantidade de pedidos (sempre 1)';
COMMENT ON COLUMN ordens_carregamento.quantidade_pedidos IS 'Quantidade de pedidos (sempre 1)';
COMMENT ON COLUMN instalacoes.metragem_quadrada IS 'Total de m² (largura x altura) das portas do pedido';
COMMENT ON COLUMN ordens_soldagem.metragem_quadrada IS 'Total de m² (largura x altura) das portas do pedido';
```

---

## Estrutura Final por Tipo de Ordem

| Ordem | Métrica de Desempenho | Status Após Migração |
|-------|----------------------|---------------------|
| **Soldagem** | `qtd_portas_p`, `qtd_portas_g`, **`metragem_quadrada`** | Completo |
| **Perfiladeira** | `metragem_linear` | Já existente |
| **Separação** | **`quantidade_itens`** | Completo |
| **Qualidade** | **`quantidade_pedidos`** | Completo |
| **Pintura** | `metragem_quadrada` | Já existente |
| **Carregamento** | **`quantidade_pedidos`** | Completo |
| **Instalação** | **`metragem_quadrada`** | Completo |

---

## Próximos Passos (Opcional)

Após a migração, pode ser útil:
1. Popular as métricas para ordens existentes via script UPDATE
2. Criar triggers para calcular automaticamente ao criar novas ordens

---

## Resumo

| Ação | Detalhes |
|------|----------|
| Migração SQL | Adicionar 5 colunas de métricas em 5 tabelas diferentes |
| Impacto | Nenhum - apenas adiciona novas colunas opcionais |
| Breaking Changes | Nenhum |
