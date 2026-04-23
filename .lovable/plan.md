

## Restringir retorno para "Aprovação CEO" apenas em Instalações ou Expedição Coleta

Hoje no modal `RetrocederEtapaModal` (usado em `/direcao/gestao-fabrica`), a etapa **Aprovação CEO** aparece como destino válido para qualquer pedido cuja etapa atual seja posterior — incluindo Em Produção, Embalagem, Finalizado, etc. O pedido deve poder voltar para Aprovação CEO **somente** quando estiver em **Instalações** ou **Expedição Coleta** (`aguardando_coleta`).

### Mudança

**Arquivo:** `src/components/pedidos/RetrocederEtapaModal.tsx`

No `useMemo` `etapasDisponiveis` (linha ~51), adicionar uma regra extra no `.filter()`:

```ts
// Aprovação CEO só pode ser destino se etapa atual for Instalações ou Expedição Coleta
if (etapa === 'aprovacao_ceo' && etapaAtual !== 'instalacoes' && etapaAtual !== 'aguardando_coleta') {
  return false;
}
```

E ajustar o `useState` inicial de `etapaDestino` para não cair em `'aberto'` quando a primeira opção da lista mudar — manter `'aberto'` como default funciona porque ele ainda estará disponível, mas garantir via efeito que `etapaDestino` seja resetado para a primeira opção válida ao abrir o modal:

```ts
useEffect(() => {
  if (open && etapasDisponiveis.length > 0 && !etapasDisponiveis.includes(etapaDestino)) {
    setEtapaDestino(etapasDisponiveis[0]);
  }
}, [open, etapasDisponiveis]);
```

### Comportamento resultante

| Etapa atual do pedido | "Aprovação CEO" no dropdown? |
|---|---|
| Em Produção | ❌ |
| Aguardando Pintura | ❌ |
| Embalagem | ❌ |
| **Expedição Coleta** | ✅ |
| **Instalações** | ✅ |
| Correções | ❌ |
| Finalizado | ❌ |

Demais etapas no dropdown continuam funcionando como hoje (filtros de pintura/instalação/entrega já existentes permanecem).

### Fora de escopo

- Não altera a função SQL `retroceder_pedido_unificado` (já suporta destino `aprovacao_ceo`).
- Não muda lógica de pausa/reativação de ordens nem o hook `useRetrocederPedido`.
- Não altera outros modais de retrocesso (ex.: `RetornarProducaoModal` da Inspeção de Qualidade).

### Arquivos

- `src/components/pedidos/RetrocederEtapaModal.tsx`

