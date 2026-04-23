

## Pedido apenas-manutenção em Instalações

Diferenciar pedidos cuja venda só contém produtos de manutenção (ex.: AID IMOVEIS LTDA) na aba **Instalações** de `/direcao/gestao-fabrica`. Esses pedidos não envolvem fabricação nem carregamento — só registrar a equipe/autorizado que fez o serviço e finalizar.

### Detecção

O pedido é "apenas manutenção" quando todos os `produtos_vendas` têm `tipo_produto = 'manutencao'` (mesma regra já usada em `usePedidoCreation` e `pedidoFluxograma`).

Como `produtos_vendas` já é carregado em `venda.produtos_vendas` no `PedidoCard`, basta derivar:
```ts
const apenasManutencao = produtos.length > 0 
  && produtos.every((p: any) => p.tipo_produto === 'manutencao');
```

### Mudanças visuais (PedidoCard, etapa = `instalacoes`)

- Quando `apenasManutencao`, substituir o badge `Hammer` (Instalação, azul) por um badge `Wrench` (Manutenção, laranja) — mesmo estilo já usado em `VendaPendentePedidoCard` (`bg-orange-500/10 text-orange-700 border-orange-500/50`).
- Aplicar tanto na linha compacta (col 6, ~linha 1518) quanto no bloco de flags da view detalhada (~linha 2223).

### Mudanças funcionais (etapa = `instalacoes`)

Hoje o botão "Avançar" só fica ativo se `carregamentoConcluido = true` (vindo de `instalacoes.carregamento_concluido`). Para pedidos apenas-manutenção:

1. **Pular validação de carregamento.** Em `getValidacaoAvancoEtapa('instalacoes')`, se `apenasManutencao`, considerar `podeAvancar = instalacao_concluida === true` (em vez de `carregamentoConcluido`). Mensagem: "Selecione a equipe/autorizado que executou o serviço para finalizar".
2. **Substituir o fluxo de "Avançar".** Em vez de abrir `ConfirmarExpedicaoModal` (que assume carregamento), abrir um novo modal `ConcluirManutencaoModal` que pede:
   - Tipo: Equipe Elisa / Autorizado (radio).
   - Responsável: select alimentado por `equipes_instalacao` (ativas) ou `autorizados` (ativos), conforme tipo.
   - Botão "Concluir e Finalizar".
3. **Ao confirmar**, atualizar `instalacoes` do pedido com:
   ```ts
   tipo_instalacao, responsavel_instalacao_id, responsavel_instalacao_nome,
   instalacao_concluida: true, instalacao_concluida_em: now(), instalacao_concluida_por: user.id,
   carregamento_concluido: true  // marca como concluído para satisfazer a fonte unificada
   ```
   Em seguida chamar `onMoverEtapa(pedido.id)` (mesma rota que leva a etapa `instalacoes` → `finalizado`, já existente).

4. **Esconder/ocultar** o botão "Definir data de carregamento" e o aviso "Defina data de carregamento" para esses pedidos (linha ~2457).

### Fluxo resultante

```text
Pedido apenas-manutenção em "Instalações"
   └─ badge laranja Manutenção (em vez de azul Instalação)
   └─ botão Avançar abre ConcluirManutencaoModal
        ├─ Tipo + Responsável
        └─ Confirma → UPDATE instalacoes + moveParaFinalizado
```

Pedidos com portas/produtos normais continuam exatamente como hoje (carregar ordem em Expedição → confirmar → finalizar).

### Fora de escopo

- Não muda criação do pedido (`usePedidoCreation` já direciona manutenção pra `instalacoes`).
- Não muda fluxo em `/logistica/expedicao` nem cards Neo.
- Não muda regras de pedidos com mistura (manutenção + portas) — esses seguem o fluxo normal.
- Sem migração de banco — usa colunas existentes em `instalacoes`.

### Arquivos

- `src/components/pedidos/PedidoCard.tsx` — derivar `apenasManutencao`, trocar badge, ajustar `getValidacaoAvancoEtapa('instalacoes')`, trocar abertura do modal e ocultar aviso de data.
- `src/components/pedidos/ConcluirManutencaoModal.tsx` (novo) — modal com seleção de tipo + responsável (reaproveita pattern de `InstalacaoDetailsSheet` para carregar `equipes_instalacao` e `autorizados`), faz `UPDATE` em `instalacoes` e dispara `onMoverEtapa`.

