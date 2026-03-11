

## Plan: Remove "Data da Última Troca de Óleo" from conferência form

Remove the `data_troca_oleo` field from `ConferenciaForm.tsx`:

### `src/components/frota/ConferenciaForm.tsx`
- Remove `data_troca_oleo` from the `ConferenciaFormData` interface
- Remove `initialDataTrocaOleo` from props
- Remove the `data_troca_oleo` default value
- Remove the date input field (lines ~73-79 for the `data_troca_oleo` input block)

### `src/pages/FrotaConferencia.tsx`
- Remove `initialDataTrocaOleo={veiculo?.data_troca_oleo}` prop from `<ConferenciaForm>`
- Remove `data_troca_oleo` from `handleSubmitConferencia` payload

Single-field removal across 2 files.

