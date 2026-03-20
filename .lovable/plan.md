

## Plano: Trocar coluna "Próx. Troca Óleo" de data para KM

### Mudanças

**1. `src/components/frota/SortableVeiculoRow.tsx`** (FrotaMinimalista)
- Linha ~85: trocar `veiculo.data_proxima_troca_oleo` por `veiculo.km_proxima_troca_oleo`
- Exibir como `veiculo.km_proxima_troca_oleo?.toLocaleString('pt-BR') + ' km'` ou `'-'`
- Remover o `format(...)` de data nessa célula

**2. `src/pages/logistica/FrotaMinimalista.tsx`**
- Linha ~56 (header): renomear "Próx. Troca Óleo" para "Km Próx. Troca"

**3. `src/pages/Frota.tsx`** (página legada, manter consistente)
- Header (~linha 89): renomear para "Km Próx. Troca"
- Body (~linha 129): trocar `format(data_proxima_troca_oleo)` por `km_proxima_troca_oleo?.toLocaleString('pt-BR') + ' km'`

