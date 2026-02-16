

# Adicionar observacao da venda na pagina do pedido

## Problema
A pagina de detalhes do pedido administrativo nao exibe a observacao cadastrada na venda (`observacoes_venda`), mesmo que essa informacao exista no banco de dados.

## Solucao
Buscar o campo `observacoes_venda` da tabela `vendas` e exibi-lo na pagina do pedido como um card de leitura, separado das observacoes editaveis do pedido.

## Alteracoes no arquivo `src/pages/administrativo/PedidoViewMinimalista.tsx`

### 1. Atualizar a interface `Pedido`
Adicionar `observacoes_venda?: string` dentro do objeto `venda` (junto aos campos existentes como `cliente_nome`, `cidade`, etc.)

### 2. Atualizar a query de busca da venda
Na linha 186, adicionar `observacoes_venda` na lista de campos do select:
```
.select(`id, cliente_nome, cidade, estado, valor_venda, forma_pagamento, tipo_entrega, data_prevista_entrega, atendente_id, observacoes_venda`)
```

### 3. Exibir a observacao da venda na interface
Adicionar um card logo antes da secao "Observacoes do Pedido" (antes da linha 571), exibindo o texto da observacao em modo somente leitura:

```
{pedido.venda?.observacoes_venda && (
  <Card>
    <CardHeader>
      <CardTitle>
        <FileText /> Observacoes da Venda
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p>{pedido.venda.observacoes_venda}</p>
    </CardContent>
  </Card>
)}
```

## Impacto
- Apenas leitura, sem alteracao de dados
- Sem migracao de banco necessaria
- O campo so aparece quando a venda possui observacao cadastrada
