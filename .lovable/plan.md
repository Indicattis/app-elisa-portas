

## Placar de ocupação na sidebar de setores

Adicionar a cada item da sidebar (desktop e mobile) um indicador mostrando `colaboradores / (colaboradores + vagas abertas)` para o setor correspondente.

### Implementação

Em `GestaoColaboradoresDirecao.tsx`:

1. **Calcular contagens por setor** — criar um helper que, para cada setor, filtra os roles ativos daquele setor, conta os users com esses roles, e soma as vagas abertas (`aberta` ou `em_analise`) desses roles:

```ts
const getSetorCounts = (setor: string) => {
  const roles = (SETOR_ROLES[setor] || []).filter(r => activeRoleKeys.includes(r));
  const users = (allUsers || []).filter(u => roles.includes(u.role as any));
  const vagasAbertas = (vagas || []).filter(v => roles.includes(v.cargo) && (v.status === 'aberta' || v.status === 'em_analise'));
  const total = users.length + vagasAbertas.length;
  return { current: users.length, total };
};
```

2. **Renderizar o placar** nos botões da sidebar desktop (linhas ~219-230) e nos chips mobile (linhas ~199-211), ao lado do label do setor, com estilo condicional (verde se completo, âmbar se há vagas).

**Arquivo:** `src/pages/direcao/GestaoColaboradoresDirecao.tsx`

