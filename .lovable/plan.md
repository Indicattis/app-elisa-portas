
# Plano: Permitir Qualquer Usuario Abrir Downbar e Imprimir Etiquetas

## Situacao Atual

### Em `ProducaoKanban.tsx` (linhas 119-137):
O `handleCardClick` bloqueia usuarios que nao sao o responsavel:
```typescript
if (!isAdmin) {
  if (ordem.responsavel_id && ordem.responsavel_id !== currentUserId) {
    toast.error(`Esta ordem pertence a ${ordem.admin_users?.nome || 'outro responsável'}`);
    return;
  }
  if (!ordem.responsavel_id) {
    toast.info("Capture a ordem primeiro para acessar os detalhes");
    return;
  }
}
```

### Em `OrdemDetalhesSheet.tsx`:
Os botoes de impressao de etiquetas sao restritos ao responsavel:
- Linha 708: `{linhas.length > 0 && isResponsavel && (` - Botao "Imprimir Todas"
- Linha 855-868: Botao de impressao individual (pintura)
- Linha 956-969: Botao de impressao individual (outras ordens)

## Mudancas Necessarias

### 1. Modificar `src/components/production/ProducaoKanban.tsx`

Remover restricao de abertura da downbar - permitir que qualquer usuario abra:

**Antes (linhas 119-137):**
```typescript
const handleCardClick = () => {
  const isAdmin = currentUserRole === 'administrador';
  
  if (!isAdmin) {
    if (ordem.responsavel_id && ordem.responsavel_id !== currentUserId) {
      toast.error(`Esta ordem pertence a ${ordem.admin_users?.nome || 'outro responsável'}`);
      return;
    }
    if (!ordem.responsavel_id) {
      toast.info("Capture a ordem primeiro para acessar os detalhes");
      return;
    }
  }
  
  onOrdemClick(ordem);
};
```

**Depois:**
```typescript
const handleCardClick = () => {
  onOrdemClick(ordem);
};
```

### 2. Modificar `src/components/production/OrdemDetalhesSheet.tsx`

Remover restricao `isResponsavel` dos botoes de impressao:

**Linha 708:** Remover condicao `isResponsavel`
```typescript
// ANTES
{linhas.length > 0 && isResponsavel && (

// DEPOIS  
{linhas.length > 0 && (
```

**Linhas 855-868 (pintura):** Remover condicao `isResponsavel`
```typescript
// ANTES
{isResponsavel && (
  <Button ...

// DEPOIS
<Button ...
```

**Linhas 956-969 (outras ordens):** Remover condicao `isResponsavel`
```typescript
// ANTES
{isResponsavel && (
  <Button ...

// DEPOIS
<Button ...
```

## Arquivos a Modificar

| Arquivo | Linha | Acao |
|---------|-------|------|
| `src/components/production/ProducaoKanban.tsx` | 119-137 | Simplificar `handleCardClick` |
| `src/components/production/OrdemDetalhesSheet.tsx` | 708 | Remover `isResponsavel` do botao "Imprimir Todas" |
| `src/components/production/OrdemDetalhesSheet.tsx` | 855-868 | Remover `isResponsavel` do botao individual (pintura) |
| `src/components/production/OrdemDetalhesSheet.tsx` | 956-969 | Remover `isResponsavel` do botao individual (outros) |

## Resultado Esperado

- Qualquer usuario podera clicar em uma ordem e abrir a downbar
- Qualquer usuario podera imprimir etiquetas de qualquer ordem
- As restricoes de marcar itens como concluidos continuam inalteradas (apenas responsavel pode marcar)
