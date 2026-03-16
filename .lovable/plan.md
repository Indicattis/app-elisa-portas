

## Plano: Adicionar tipo de frota (empresa/particular) e seção de carros particulares

### Mudanças

**1. Migração SQL**
- Adicionar coluna `tipo_frota text not null default 'empresa'` na tabela `veiculos`
- Valores: `'empresa'` ou `'particular'`

**2. `src/hooks/useVeiculos.ts`**
- Adicionar `tipo_frota` na interface `Veiculo` e `VeiculoFormData`

**3. `src/pages/logistica/FrotaMinimalista.tsx`**
- Separar veículos em duas seções: "Frota da Empresa" e "Carros Particulares do Luan"
- Cada seção com sua própria tabela e drag-and-drop independente
- Título de seção estilizado para diferenciar visualmente

**4. `src/pages/logistica/FrotaNovoMinimalista.tsx`**
- Adicionar campo Select "Tipo de Frota" com opções "Empresa" e "Particular"
- Enviar `tipo_frota` no `createVeiculo`

**5. `src/components/frota/VeiculoForm.tsx`**
- Adicionar campo Select "Tipo de Frota" no formulário (usado na página antiga e edição)

