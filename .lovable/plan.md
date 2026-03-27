

## Plano: Corrigir `isGerente` em `/producao/instalacoes`

### Problema
`isGerente` está hardcoded como `true`, fazendo todos os usuários verem todas as instalações.

### Solução
Usar a mesma lógica já existente em `CronogramaMinimalista.tsx`: verificar se o role do usuário está em uma lista de cargos de gerência.

### Alteração

**`src/pages/producao/ProducaoInstalacoes.tsx`**
- Substituir `const isGerente = true;` por:
```typescript
const ROLES_GERENTE = ['administrador', 'gerente_fabril', 'gerente_instalacoes', 'diretor'];
const isGerente = ROLES_GERENTE.includes(user?.role || '');
```

### Arquivo alterado
- `src/pages/producao/ProducaoInstalacoes.tsx` — 1 linha substituída

