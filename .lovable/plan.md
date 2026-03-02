

# Filtro "Todas as categorias" e Modal de Upload multiplo em Midias

## Resumo
Adicionar uma opcao "Todas as categorias" ao filtro de buckets para exibir arquivos de todos os buckets ao mesmo tempo, e substituir o upload direto por um modal que permite selecionar o bucket de destino e fazer upload de multiplos arquivos de imagem.

## Alteracoes

### 1. Filtro "Todas as categorias" (`MidiasMinimalista.tsx`)
- Adicionar a opcao "Todas as categorias" como primeiro item do Select de buckets
- Quando selecionado, buscar arquivos de todos os buckets em paralelo usando `Promise.all`
- Exibir o nome do bucket de origem ao lado de cada arquivo na listagem
- Ajustar as acoes (copiar URL, preview, excluir) para usar o bucket correto de cada arquivo

### 2. Modal de Upload (`MidiasMinimalista.tsx`)
- Ao clicar em "Upload", abrir um Dialog (modal) em vez de abrir o file picker diretamente
- O modal contera:
  - Select para escolher o bucket de destino (obrigatorio)
  - Area de selecao de arquivos com `accept="image/*"` e `multiple`
  - Lista dos arquivos selecionados com preview em miniatura e opcao de remover individualmente
  - Botao "Enviar" que faz upload de todos os arquivos selecionados em sequencia
  - Barra de progresso mostrando quantos arquivos foram enviados
- Apos concluir todos os uploads, fechar o modal e recarregar a listagem

### Detalhes tecnicos

**Estrutura de dados para "Todas as categorias":**
```text
interface StorageFileWithBucket extends StorageFile {
  bucket: string;  // nome do bucket de origem
}
```

**Logica de busca quando "todas" esta selecionado:**
- Iterar sobre todos os BUCKETS com Promise.allSettled
- Concatenar resultados, adicionando o campo `bucket` a cada arquivo
- Ordenar por data de criacao (desc)

**Modal de upload:**
- Estado `uploadModalOpen` para controlar visibilidade
- Estado `selectedFiles` (File[]) para arquivos escolhidos
- Estado `uploadBucket` para bucket de destino selecionado no modal
- Input file com `multiple` e `accept="image/*"`
- Upload sequencial com contagem de progresso

