
# Exibir arquivos em grid com thumbnails

## Objetivo
Substituir a listagem de arquivos em formato de lista por um grid de cards 100x100px com thumbnails das imagens.

## Alteracoes

### Arquivo: `src/pages/marketing/MidiasMinimalista.tsx`

**Substituir a secao "File list" (linhas 381-420):**

- Trocar o layout de lista (`grid gap-2`) por um grid responsivo com cards de 100x100px
- Cada card tera:
  - Thumbnail da imagem (usando `getPublicUrl` do Supabase) ou icone generico para nao-imagens
  - Nome do arquivo truncado na parte inferior
  - Ao passar o mouse (hover), exibir botoes de acao (preview, copiar URL, excluir) como overlay
  - Se "Todas as categorias" estiver selecionado, mostrar o nome do bucket como badge pequeno

**Layout do grid:**
```text
grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3
```

**Estrutura de cada card (100x100px):**
```text
+-------------------+
|                   |
|   thumbnail/icon  |  <-- object-cover, rounded
|                   |
|   [hover overlay] |  <-- botoes de acao
+-------------------+
| nome-arquivo.jpg  |  <-- truncado, text-xs
+-------------------+
```

- Para imagens: usar `supabase.storage.from(file.bucket).getPublicUrl(file.name)` como src da tag `<img>`
- Para nao-imagens: exibir o icone `FileIcon` centralizado
- Overlay no hover com fundo semi-transparente contendo os 3 botoes (Eye, Copy, Trash2)
