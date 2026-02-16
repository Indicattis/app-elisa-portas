

# Novo sistema de pontuacoes por linha/ordem

## Resumo
Reestruturar a tabela `pontuacao_colaboradores` para armazenar metricas especificas por tipo de ordem (metragem linear, categoria da porta, pedidos separados, metragem quadrada pintada), com regras condicionais de quando a pontuacao e criada: por linha para perfiladeira, e por ordem para solda, separacao e pintura.

## Regras de negocio

| Tipo | Quando pontua | O que armazena | Granularidade |
|------|---------------|----------------|---------------|
| Perfiladeira | Ao marcar cada LINHA | `metragem_linear` (tamanho x quantidade) | 1 registro por linha |
| Solda | Ao concluir a ORDEM | `porta_soldada` (P, G ou GG baseado na area da porta) | 1 registro por linha da ordem |
| Separacao | Ao concluir a ORDEM | `pedido_separado` = 1 | 1 registro por ORDEM (nao por linha) |
| Pintura | Ao concluir a ORDEM | `metragem_quadrada_pintada` (m2 das portas) | 1 registro por linha da ordem |

- Cada pontuacao e vinculada a uma `linha_id` (exceto separacao, que vincula a primeira linha da ordem)
- UNIQUE constraint em `linha_id` garante no maximo 1 pontuacao por linha
- Desmarcar uma linha NAO remove a pontuacao existente
- Remarcar uma linha que ja tem pontuacao NAO cria duplicata (ON CONFLICT DO NOTHING)
- Categorias de porta: P (< 25m2), G (25-50m2), GG (> 50m2)

## Detalhes tecnicos

### 1. Migracao SQL

**Alterar tabela `pontuacao_colaboradores`:**
- Adicionar coluna `metragem_linear` (NUMERIC, nullable)
- Adicionar coluna `porta_soldada` (TEXT, nullable) -- valores: 'P', 'G', 'GG'
- Adicionar coluna `pedido_separado` (INTEGER, nullable) -- valor: 1
- Adicionar coluna `metragem_quadrada_pintada` (NUMERIC, nullable)

**Reescrever a funcao `registrar_pontuacao_linha()`:**
- Manter como trigger AFTER UPDATE OF concluida ON linhas_ordens
- Condicao: `NEW.concluida = true AND OLD.concluida = false AND NEW.concluida_por IS NOT NULL`
- Comportamento condicional por `tipo_ordem`:
  - `perfiladeira`: calcula metragem_linear = tamanho (parseado) x quantidade, insere imediatamente
  - Outros tipos (`soldagem`, `separacao`, `pintura`): NAO faz nada no trigger de linha (sera tratado no trigger de ordem)

**Criar nova funcao `registrar_pontuacao_ordem()`:**
- Trigger AFTER UPDATE OF status em ordens_soldagem, ordens_separacao, ordens_pintura
- Condicao: `NEW.status IN ('concluido', 'pronta') AND OLD.status != NEW.status`
- Comportamento:
  - **Soldagem**: busca as portas_enrolar do pedido via pedidos_producao -> vendas -> produtos_vendas, classifica cada porta (P/G/GG pela area), insere 1 registro por linha da ordem com `porta_soldada`
  - **Separacao**: insere 1 unico registro vinculado a primeira linha, com `pedido_separado = 1`
  - **Pintura**: calcula m2 total das portas do pedido (largura x altura), insere 1 registro por linha com `metragem_quadrada_pintada` rateada

### 2. Alteracoes no frontend

**`src/hooks/useOrdemProducao.ts`:**
- Na mutation `marcarLinhaConcluida`: sem mudancas (trigger cuida da perfiladeira)
- Na mutation `concluirOrdem`: sem mudancas (trigger de ordem cuida de solda/separacao)
- Remover comentario sobre pontuacao do trigger

**`src/hooks/useOrdemPintura.ts`:**
- Sem mudancas na conclusao (trigger de ordem cuida da pintura)

**`src/hooks/useMetaProgressoCalculado.ts`:**
- Reescrever para consultar `pontuacao_colaboradores` em vez das tabelas de ordens
- Para perfiladeira: `SUM(metragem_linear)` filtrado por user_id e periodo
- Para solda: `COUNT(porta_soldada)` filtrado por user_id e periodo
- Para separacao: `SUM(pedido_separado)` filtrado por user_id e periodo
- Para pintura: `SUM(metragem_quadrada_pintada)` filtrado por user_id e periodo
- Para qualidade/carregamento: manter consulta atual (sem pontuacao especifica)

**`src/hooks/useMetaProgresso.ts`:**
- Atualizar calculo inline para usar `pontuacao_colaboradores`

### 3. Detalhes dos triggers SQL

```text
registrar_pontuacao_linha() - trigger em linhas_ordens
  |
  +-- tipo_ordem = 'perfiladeira'
  |     -> INSERT pontuacao (metragem_linear = tamanho * quantidade)
  |        ON CONFLICT (linha_id) DO NOTHING
  |
  +-- outros tipos -> nao faz nada

registrar_pontuacao_ordem() - triggers em ordens_soldagem/separacao/pintura
  |
  +-- ordens_soldagem (status -> concluido)
  |     -> Para cada porta do pedido: INSERT (porta_soldada = P/G/GG)
  |        vinculado a linhas da ordem, ON CONFLICT DO NOTHING
  |
  +-- ordens_separacao (status -> concluido)
  |     -> INSERT 1 registro (pedido_separado = 1)
  |        vinculado a primeira linha, ON CONFLICT DO NOTHING
  |
  +-- ordens_pintura (status -> concluido/pronta)
        -> Para cada linha: INSERT (metragem_quadrada_pintada = m2)
           ON CONFLICT DO NOTHING
```

### 4. Arquivos envolvidos
- Migracao SQL (nova tabela + triggers)
- `src/hooks/useMetaProgressoCalculado.ts` (reescrever queries)
- `src/hooks/useMetaProgresso.ts` (atualizar calculo)
- `src/components/ordens/OrdensAccordion.tsx` (manter delete de pontuacoes ao deletar ordem)

