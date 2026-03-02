

# Adicionar pagina "Midias" ao Marketing

## Objetivo
Criar uma nova pagina `/marketing/midias` que permite ao usuario visualizar, fazer upload, e excluir arquivos armazenados nos buckets do Supabase Storage.

## Alteracoes

### 1. Adicionar item no menu do MarketingHub
**Arquivo:** `src/pages/marketing/MarketingHub.tsx`
- Adicionar `{ label: "Midias", icon: Image, path: "/marketing/midias", ativo: true }` ao array `menuItems`
- Importar icone `Image` do lucide-react

### 2. Criar pagina MidiasMinimalista
**Arquivo:** `src/pages/marketing/MidiasMinimalista.tsx`

Funcionalidades:
- Layout usando `MinimalistLayout` (mesmo padrao das outras paginas de marketing)
- Select para escolher o bucket (lista dos 13 buckets existentes)
- Listagem de arquivos do bucket selecionado com nome, tamanho e data
- Botao de upload para adicionar novos arquivos ao bucket selecionado
- Botao de excluir arquivo (com confirmacao via AlertDialog)
- Preview de imagens (para arquivos de imagem)
- Botao para copiar URL publica (para buckets publicos)
- Indicador de loading durante operacoes

Buckets disponiveis:
- autorizados-logos, catalogo-produtos, chamados-suporte-anexos, comprovantes-pagamento, contas-pagar, contratos-autorizados, contratos-vendas, documentos-publicos, fichas-visita-tecnica, fotos-carregamento, lead-anexos, user-avatars, veiculos-fotos

### 3. Adicionar rota no App.tsx
**Arquivo:** `src/App.tsx`
- Adicionar rota `<Route path="/marketing/midias" element={<ProtectedRoute routeKey="marketing_midias"><MidiasMinimalista /></ProtectedRoute>} />`
- Importar `MidiasMinimalista`

### Detalhes tecnicos

A pagina usara a API do Supabase Storage:
```text
supabase.storage.from(bucket).list()      -- listar arquivos
supabase.storage.from(bucket).upload()    -- upload
supabase.storage.from(bucket).remove()    -- excluir
supabase.storage.from(bucket).getPublicUrl() -- URL publica
```

A interface seguira o padrao visual das demais paginas do marketing (fundo escuro, cards com bordas sutis, icones lucide-react).
