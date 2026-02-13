

# Fix: Botao "Novo" em /administrativo/documentos redirecionando para /home

## Problema
O botao "Novo" na pagina de Documentos aponta para `/dashboard/documentos/novo`, mas essa rota nao existe no App.tsx. Como nenhuma rota corresponde, o sistema redireciona para `/home`.

## Correcao

### 1. Arquivo: `src/pages/administrativo/DocumentosMinimalista.tsx`
- Alterar todos os `Link to="/dashboard/documentos/novo"` para `Link to="/administrativo/documentos/novo"` (linhas 69 e 141)

### 2. Arquivo: `src/App.tsx`
- Adicionar nova rota `/administrativo/documentos/novo` apontando para o componente `DocumentoNovo`, protegida com `routeKey="administrativo_hub"`, logo apos a rota de `/administrativo/documentos`

### 3. Arquivo: `src/pages/DocumentoNovo.tsx`
- Alterar o botao voltar e o botao cancelar de `navigate('/dashboard/documentos')` para `navigate('/administrativo/documentos')` (linhas 97 e 171)

