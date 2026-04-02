

## Plano: Ativar etapa de pintura para o pedido #0317

### Problema
Os 4 produtos do pedido têm `valor_pintura = 0` e `cor_id = null`. O fluxograma não inclui "Aguardando Pintura" porque nenhum produto tem pintura.

### Solução
Atualizar os 4 registros em `produtos_vendas` via insert tool:
- `valor_pintura = 1.00` (valor simbólico)
- `cor_id = 'e1e95174-95c4-4616-88fb-d0aa90e213a0'` (Verde Escuro, hex #2d533a)

### IDs dos produtos
- `7d651aa1-6da7-4f66-8f44-8b6a6f0a8292`
- `bdeec409-c417-4599-9330-9b30a4729b6d`
- `e44838c7-6586-491e-848d-513ab6522dbe`
- `4caba4b1-8f7e-4a86-ab5e-e42d64e7c10f`

### Resultado
O `determinarFluxograma` detectará `valor_pintura > 0` e incluirá "Aguardando Pintura" e "Embalagem" no fluxo. Nenhuma alteração de código necessária.

### Arquivo alterado
- Nenhum (apenas UPDATE no banco via insert tool)

