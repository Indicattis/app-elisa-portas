

# Aceitar PNG e JPG alem de PDF no upload de documentos

## Resumo
Atualizar a pagina de upload de documentos para aceitar imagens PNG e JPG alem de PDF.

## Alteracoes

### Arquivo: `src/pages/DocumentoNovo.tsx`

1. **Validacao de tipo** (linha 38): Trocar a verificacao `file.type !== 'application/pdf'` por uma lista de tipos permitidos: `['application/pdf', 'image/png', 'image/jpeg']`
2. **Mensagem de erro** (linha 41): Atualizar para "Apenas arquivos PDF, PNG e JPG sao permitidos"
3. **Mensagem de erro no submit** (linha 64): Atualizar de "Selecione um arquivo PDF" para "Selecione um arquivo"
4. **Subtitulo da pagina** (linha 110): Alterar "Adicione um novo documento PDF" para "Adicione um novo documento"
5. **Descricao do card** (linha 119): Alterar "upload do arquivo PDF" para "upload do arquivo"
6. **Label do campo** (linha 163): Alterar "Arquivo PDF *" para "Arquivo *"
7. **Texto do botao** (linha 171): Alterar "Escolher arquivo PDF" para "Escolher arquivo"
8. **Input accept** (linha 177): Alterar `accept=".pdf"` para `accept=".pdf,.png,.jpg,.jpeg"`
9. **Texto informativo** (linha 182): Alterar "Apenas arquivos PDF" para "PDF, PNG ou JPG"
10. **Icone do arquivo selecionado** (linha 190): Mostrar icone de imagem (`Image` do lucide-react) quando for PNG/JPG, mantendo `FileText` para PDF

