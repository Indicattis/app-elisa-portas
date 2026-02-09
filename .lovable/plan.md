
# Adicionar coluna de logo na tabela de autorizados por estado

## Resumo

Adicionar uma coluna com o avatar/logo de cada autorizado nas tabelas dentro das cidades colapsaveis na pagina do estado.

## Detalhes tecnicos

### 1. Atualizar interface `AutorizadoResumo` em `src/hooks/useEstadosCidades.ts`
- Adicionar campo `logo_url?: string | null` a interface

### 2. Incluir `logo_url` na query de autorizados em `src/hooks/useEstadosCidades.ts`
- Linha 111: alterar select de `'id, nome, cidade, estado, etapa'` para `'id, nome, cidade, estado, etapa, logo_url'`
- Incluir `logo_url` no mapeamento dos autorizados para `AutorizadoResumo`

### 3. Adicionar coluna "Logo" na tabela em `src/components/autorizados/CidadeCollapsible.tsx`
- Importar `Avatar`, `AvatarImage`, `AvatarFallback` de `@/components/ui/avatar`
- Adicionar `TableHead` de logo como primeira coluna (antes de "Autorizado")
- No `AutorizadoRow`, adicionar `TableCell` com um `Avatar` de tamanho pequeno (h-7 w-7) exibindo a imagem ou as iniciais do nome
- Fazer o mesmo na tabela de orfaos (`OrfaosCollapsible`)

### Arquivos

1. **Editar**: `src/hooks/useEstadosCidades.ts` -- adicionar `logo_url` na interface e na query
2. **Editar**: `src/components/autorizados/CidadeCollapsible.tsx` -- adicionar coluna de logo nas duas tabelas
