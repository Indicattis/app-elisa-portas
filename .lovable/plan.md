

## Plano: Mostrar endereço completo no PedidoDetalhesSheet

### Problema
O componente `PedidoDetalhesSheet.tsx` (linha 530-533) mostra apenas `venda.cidade - venda.estado`. O objeto `pedido` já contém campos de endereço completo (`endereco_rua`, `endereco_numero`, `endereco_bairro`, `endereco_cidade`, `endereco_estado`, `endereco_cep`) que não estão sendo usados.

### Alteração

**`src/components/pedidos/PedidoDetalhesSheet.tsx`** (linhas 528-534)

Substituir a exibição atual por lógica que prioriza os dados do pedido com fallback para dados da venda:

- Montar endereço completo: `{rua}, {numero} - {bairro} - {cidade}/{estado} - CEP {cep}`
- Priorizar `pedido.endereco_*`, com fallback para `venda.cidade` / `venda.estado`
- Omitir partes vazias automaticamente

Padrão já usado em `AcaoEtapaModal.tsx` e `HistoricoOrdemDetalhesSheet.tsx` — será consistente com o resto do sistema.

### Resultado
O endereço completo aparecerá na seção hero do sheet de detalhes do pedido.

