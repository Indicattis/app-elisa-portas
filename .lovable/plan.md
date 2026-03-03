

# Corrigir margem de lucro de instalações no DRE

## Problema

As vendas com instalação que ainda não foram faturadas têm `lucro_instalacao = null` no banco. O DRE lê esse valor diretamente, resultando em lucro 0 e margem 0% para instalações — quando deveria ser 30%.

## Solução

No `DREMesDirecao.tsx`, ao calcular `totalLucroInstalacao`, aplicar a regra de negócio: se `lucro_instalacao` for null/0 mas `valor_instalacao > 0`, usar `valor_instalacao * 0.30` como lucro.

### Alteração (~linha 318)

**De:**
```typescript
const totalLucroInstalacao = vendas?.reduce((sum, v) => sum + ((v as any).lucro_instalacao || 0), 0) || 0;
```

**Para:**
```typescript
const totalLucroInstalacao = vendas?.reduce((sum, v) => {
  const valorInst = (v as any).valor_instalacao || 0;
  const lucroInst = (v as any).lucro_instalacao;
  return sum + (lucroInst != null && lucroInst > 0 ? lucroInst : valorInst * 0.30);
}, 0) || 0;
```

Isso garante que vendas já faturadas usem o valor real do banco, e vendas não faturadas apliquem a margem padrão de 30%.

### Arquivo alterado
- `src/pages/direcao/DREMesDirecao.tsx`

