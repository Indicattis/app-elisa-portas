

## Plano: Aprovar/Reprovar acordos em /direcao/autorizados

### Problema
A página `/direcao/autorizados` exibe acordos em modo somente leitura. O usuário quer poder aprovar ou reprovar acordos diretamente nesta página.

### Alterações

#### 1. Migração SQL — Adicionar campo de reprovação
Adicionar coluna `reprovado_direcao` (boolean, default false) na tabela `acordos_instalacao_autorizados` para distinguir entre pendente, aprovado e reprovado.

```sql
ALTER TABLE acordos_instalacao_autorizados 
  ADD COLUMN IF NOT EXISTS reprovado_direcao boolean DEFAULT false;
```

#### 2. Arquivo: `src/pages/direcao/AutorizadosPrecosDirecao.tsx`

Quando `contexto === 'direcao'`, adicionar uma coluna **"Aprovação"** na tabela de acordos com:

- **Acordo pendente** (`aprovado_direcao = false` e `reprovado_direcao = false`): dois botões — "Aprovar" (verde, ícone Check) e "Reprovar" (vermelho, ícone X)
- **Acordo aprovado** (`aprovado_direcao = true`): Badge verde "Aprovado" com ícone CheckCircle2
- **Acordo reprovado** (`reprovado_direcao = true`): Badge vermelho "Reprovado" com ícone XCircle

Lógica de aprovação (mesma de `AprovacoesAutorizados.tsx`):
```tsx
await supabase.from('acordos_instalacao_autorizados')
  .update({ aprovado_direcao: true, aprovado_direcao_por: user?.id, aprovado_direcao_em: new Date().toISOString() })
  .eq('id', acordoId);
```

Lógica de reprovação:
```tsx
await supabase.from('acordos_instalacao_autorizados')
  .update({ reprovado_direcao: true })
  .eq('id', acordoId);
```

Imports adicionais: `Check`, `X`, `CheckCircle2`, `XCircle` do lucide-react; `useAuth` e `useToast`.

Estado local: `approvingId` e `rejectingId` para loading nos botões.

#### 3. Arquivo: `src/hooks/useAcordosAutorizados.ts`

Adicionar `aprovado_direcao` e `reprovado_direcao` à interface `AcordoAutorizado` e ao mapeamento no `fetchAcordos` para que a informação esteja disponível sem cast `as any`.

