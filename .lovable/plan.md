

## Plan: Move "atendente" role to "vendas" sector

Currently in `src/utils/setorMapping.ts`, `atendente` is listed under `administrativo`. It needs to be moved to `vendas`.

### Change in `src/utils/setorMapping.ts`

- Remove `'atendente'` from the `administrativo` array
- Add `'atendente'` to the `vendas` array

Result:
```
vendas: ['gerente_comercial', 'coordenador_vendas', 'vendedor', 'atendente']
administrativo: ['diretor', 'administrador', 'gerente_financeiro', 'assistente_administrativo']
```

Single file change, immediate effect on the organogram grouping.

