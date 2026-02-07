

# Fix: Trigger sobrescreve etapa_atual durante retrocesso

## Problema

Ao retroceder o pedido, as ordens foram excluídas corretamente mas o `etapa_atual` permaneceu em `inspecao_qualidade`. Isso acontece por causa de um **conflito entre a funcao e um trigger**.

### Causa raiz

Existe um trigger `sync_pedido_etapa_atual` na tabela `pedidos_etapas` que sincroniza automaticamente o campo `etapa_atual` em `pedidos_producao`. A sequencia atual da funcao e:

1. `UPDATE pedidos_producao SET etapa_atual = 'aberto'` (funcao define corretamente)
2. `UPDATE pedidos_etapas SET data_saida = now()` (fecha etapas abertas — **trigger dispara e sobrescreve etapa_atual de volta para inspecao_qualidade**)
3. `INSERT/UPSERT pedidos_etapas` (abre nova etapa — trigger dispara novamente, mas com timestamp ambiguo)

O resultado e que o trigger sobrescreve o valor correto que a funcao acabou de definir.

## Solucao

### 1. Corrigir os dados do pedido afetado

Atualizar manualmente o pedido para o estado correto:

```sql
UPDATE pedidos_producao 
SET etapa_atual = 'aberto', em_backlog = false, status = 'pendente'
WHERE id = '5ee4873b-caf7-4be8-b00e-acca2e00f55d';
```

### 2. Corrigir a funcao `retroceder_pedido_unificado`

Mover o `UPDATE pedidos_producao SET etapa_atual = ...` para **depois** das operacoes em `pedidos_etapas`. Assim:

1. Fecha etapas → trigger dispara (valor temporario)
2. Upsert nova etapa → trigger dispara (valor possivelmente correto)
3. **UPDATE explicito define o valor definitivo** → sobrescreve qualquer coisa que o trigger tenha feito

A mudanca e apenas na **ordem das operacoes** dentro da funcao — mover o bloco `UPDATE pedidos_producao SET etapa_atual = ...` dos CASOS 1/2/3 para depois do bloco comum de `pedidos_etapas`.

### Arquivos alterados

1. **Migracao de banco**: Recriar `retroceder_pedido_unificado` com a ordem correta
2. **Correcao de dados**: UPDATE no pedido especifico

