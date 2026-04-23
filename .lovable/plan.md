

## Pedidos "apenas separação" finalizam como manutenção

Permitir que pedidos cujas linhas de produção sejam **todas** de `categoria_linha = 'separacao'` (sem solda nem perfiladeira) sejam finalizados na etapa **Instalações** pelo mesmo fluxo dos pedidos apenas-manutenção: sem exigir carregamento, abrindo o `ConcluirManutencaoModal` para registrar a equipe/autorizado responsável.

### Detecção

Adicionar uma nova query em `PedidoCard.tsx` (ao lado de `pedido-linhas-count`) que conta linhas por categoria do pedido:

```ts
const { data: temApenasSeparacao = false } = useQuery({
  queryKey: ['pedido-linhas-categorias', pedido.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('pedido_linhas')
      .select('categoria_linha')
      .eq('pedido_id', pedido.id);
    if (!data || data.length === 0) return false;
    return data.every(l => l.categoria_linha === 'separacao');
  },
  enabled: pedido.etapa_atual === 'instalacoes',
});
```

Derivar então:
```ts
const finalizaSemCarregamento = apenasManutencao || temApenasSeparacao;
```

### Mudanças no `PedidoCard.tsx`

Substituir as referências a `apenasManutencao` que controlam **fluxo de finalização sem carregamento** por `finalizaSemCarregamento`:

1. **Validação de avanço** (linhas ~330-343): `etapa === 'instalacoes' && finalizaSemCarregamento` → libera Avançar com mensagem "Selecione a equipe/autorizado que executou o serviço para finalizar".
2. **Botão Avançar** (linhas ~1828 e ~2429): condição `(carregamentoConcluido || (etapaAtual === 'instalacoes' && finalizaSemCarregamento))` e `if (etapaAtual === 'instalacoes' && finalizaSemCarregamento) setShowConcluirManutencao(true)`.
3. **Esconder botão de agendar carregamento e aviso "Defina data de carregamento"** (linhas ~1713 e ~2497): trocar `!apenasManutencao` por `!finalizaSemCarregamento`.

**Não alterar** o badge laranja de "Manutenção" (linhas 1529 e 2261) — esse continua usando `apenasManutencao` puro, pois pedidos de separação seguem com seu badge de Instalação azul normal.

### Fluxo resultante

```text
Pedido na etapa Instalações com linhas só de separação
  └─ badge Instalação (azul) — normal
  └─ botão Avançar abre ConcluirManutencaoModal
       ├─ Tipo + Responsável (Equipe Elisa / Autorizado)
       └─ Confirma → UPDATE instalacoes (instalacao_concluida + carregamento_concluido = true)
                  → onMoverEtapa → Finalizado
```

Pedidos com qualquer linha de solda ou perfiladeira continuam exigindo carregamento concluído como hoje.

### Fora de escopo

- Sem migração de banco — usa `pedido_linhas.categoria_linha` e `instalacoes` existentes.
- Não altera fluxo nas etapas anteriores (Aberto, Em Produção, Inspeção, etc.). O pedido ainda passa pela produção da separação normalmente; o atalho é só na finalização.
- Não muda `/logistica/expedicao` nem o badge visual.
- Pedidos `apenasManutencao` continuam exatamente como hoje.

### Arquivos

- `src/components/pedidos/PedidoCard.tsx` — nova query `pedido-linhas-categorias`, derivar `finalizaSemCarregamento`, trocar 5 referências indicadas.

