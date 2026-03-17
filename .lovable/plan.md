

## Plano: Tornar Km Atual e Km Próxima Troca editáveis no fluxo de Troca de Óleo

### Contexto
Os campos "Km Atual" e "Km Próxima Troca" no formulário de troca de óleo (linhas 234-251) estão `readOnly` com valores computados. O usuário quer poder editá-los.

### Mudanças em `src/pages/logistica/FrotaConferenciaMinimalista.tsx`

1. **Adicionar states** para `kmAtualTroca` e `kmProximaTroca`, inicializados via `useEffect` quando o veículo é selecionado:
   - `kmAtualTroca` = `veiculo.km_atual`
   - `kmProximaTroca` = `(veiculo.km_atual || 0) + 5000`

2. **Tornar os inputs editáveis** (remover `readOnly` e `opacity-60`):
   - "Km Atual" → controlado por `kmAtualTroca` / `setKmAtualTroca`
   - "Km Próxima Troca" → controlado por `kmProximaTroca` / `setKmProximaTroca`

3. **Atualizar `handleSubmitTrocaOleo`** para usar os valores dos states em vez de calculá-los automaticamente:
   - `km_atual` do veículo atualizado com `kmAtualTroca`
   - `km_proxima_troca_oleo` atualizado com `kmProximaTroca`

