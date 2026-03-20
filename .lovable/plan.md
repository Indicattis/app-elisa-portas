

## Plano: Porta única com medidas de largura e altura

### Resumo
Simplificar o formulário de acordo para permitir apenas **uma porta** com seleção de tamanho (P/G/GG) e campos de **largura** e **altura**. Remover a lista dinâmica de múltiplas portas.

### 1. Migração de banco de dados
Adicionar colunas `largura` e `altura` na tabela `acordo_portas`:
```sql
ALTER TABLE acordo_portas
  ADD COLUMN largura numeric,
  ADD COLUMN altura numeric;
```

### 2. Alterações no formulário (`NovoAcordoDialog.tsx`)
- Remover a lista dinâmica de portas (botões adicionar/remover)
- Substituir por uma seção "PORTA" com:
  - Select de tamanho (P / G / GG)
  - Input de largura (metros)
  - Input de altura (metros)
- Ao salvar, enviar array com uma única porta contendo `tamanho`, `valor_unitario`, `largura` e `altura`

### 3. Tipos e hook (`useAcordosAutorizados.ts`)
- Adicionar `largura?` e `altura?` ao interface `PortaAcordo`
- Incluir `largura` e `altura` nos inserts/selects de `acordo_portas`

### Arquivos impactados
- `acordo_portas` (migração)
- `src/components/autorizados/NovoAcordoDialog.tsx`
- `src/hooks/useAcordosAutorizados.ts`

