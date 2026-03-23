

## Plano: Substituir seção de Acordos pelo conteúdo de Pagamentos Autorizados

### Contexto
A seção "Acordos com Autorizados" em `/direcao/autorizados` (linhas 242-389 de `AutorizadosPrecosDirecao.tsx`) tem uma tabela simplificada. A página `/logistica/pagamentos-autorizados` (`AcordosAutorizados.tsx`) tem uma versão mais rica com:
- Coluna "Medidas" (largura × altura)
- Tooltip no hover da linha mostrando preços padrão do autorizado (P/G/GG)
- Busca de `precosMap` via `autorizado_precos_portas`
- Ordem de colunas diferente (Portas, Medidas, Autorizado, Cliente, Cidade, Data, Valor, Excesso, Status)

### Alteração

**Arquivo: `src/pages/direcao/AutorizadosPrecosDirecao.tsx`**

1. Adicionar `useEffect` e import do `supabase` para buscar `precosMap` (preços padrão dos autorizados), copiando a lógica de `AcordosAutorizados.tsx` (linhas 63-80)

2. Substituir a seção "Acordos com Autorizados" (linhas 242-389) pela tabela de `AcordosAutorizados.tsx`:
   - Mesmas colunas: Portas, Medidas, Autorizado, Cliente, Cidade, Data, Valor, Valor excesso, Status
   - Tooltip no hover de cada linha mostrando preços padrão P/G/GG
   - Coluna "Ações" aparece apenas quando `contexto === 'logistica'` (direção vê somente leitura)
   - Manter filtros de busca e status já existentes na seção

3. Remover imports não mais usados (Avatar/AvatarFallback/AvatarImage que eram usados na coluna "Criado por")

Nenhum outro arquivo precisa ser alterado.

