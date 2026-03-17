

## Plano: Adicionar campos Km Próxima Troca e Data Próxima Troca no formulário de conferência

### Contexto
O formulário de conferência já tem "Km Atual". O veículo (`veiculos`) já possui colunas `km_proxima_troca_oleo` e `data_proxima_troca_oleo`. Basta expor esses campos no form e atualizar o veículo ao submeter.

### Mudanças

#### 1. `src/components/frota/ConferenciaForm.tsx`
- Adicionar `km_proxima_troca_oleo?: number` e `data_proxima_troca_oleo?: string` à interface `ConferenciaFormData`
- Adicionar props `initialKmProximaTroca?: number` e `initialDataProximaTroca?: string` à interface `ConferenciaFormProps`
- Adicionar defaults no `useForm`
- Renderizar dois novos campos após "Km Atual":
  - **Km Próxima Troca** (input number, opcional)
  - **Data Próxima Troca** (input date, opcional)

#### 2. `src/pages/FrotaConferencia.tsx`
- Passar `initialKmProximaTroca={veiculo?.km_proxima_troca_oleo}` e `initialDataProximaTroca={veiculo?.data_proxima_troca_oleo}` ao `ConferenciaForm`
- No `handleSubmitConferencia`, após criar a conferência, chamar `updateVeiculo` para atualizar `km_atual`, `km_proxima_troca_oleo` e `data_proxima_troca_oleo` no veículo
- Importar `updateVeiculo` do `useVeiculos`

Nenhuma migration necessária -- as colunas já existem na tabela `veiculos`.

