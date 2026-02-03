
# Plano: Corrigir Impressao de Etiquetas (Erro Cross-Origin)

## Problema Identificado

O console mostra o erro:
```
SecurityError: Failed to read a named property 'print' from 'Window': 
Blocked a frame with origin "...lovableproject.com" from accessing a cross-origin frame.
```

### Causa raiz:
O codigo atual cria um iframe oculto e tenta chamar `iframe.contentWindow?.print()`. Isso funciona em ambientes locais, mas no ambiente do Lovable Preview, o blob URL do PDF e o iframe estao em contextos de origem diferentes, causando bloqueio de seguranca.

### Funcoes afetadas em `OrdemDetalhesSheet.tsx`:
1. `handleImprimirEtiqueta` (linhas 201-271) - impressao individual
2. `handleImprimirTodasEtiquetas` (linhas 313-414) - impressao multipla

---

## Solucao Proposta

Substituir a abordagem de iframe por `window.open()` para abrir o PDF em uma nova aba. O usuario podera então imprimir usando Ctrl+P ou o menu de impressao do navegador.

### Modificacoes em `src/components/production/OrdemDetalhesSheet.tsx`

**Funcao `handleImprimirEtiqueta` (linhas 222-266):**
```typescript
// ANTES - iframe oculto
const blobUrl = String(doc.output('bloburl'));
const iframe = document.createElement('iframe');
// ... codigo do iframe ...
iframe.contentWindow?.print();

// DEPOIS - nova aba
const blobUrl = String(doc.output('bloburl'));
const printWindow = window.open(blobUrl, '_blank');
if (printWindow) {
  printWindow.onload = () => {
    printWindow.print();
  };
}
```

**Funcao `handleImprimirTodasEtiquetas` (linhas 369-407):**
```typescript
// ANTES - iframe oculto
const blobUrl = String(doc.output('bloburl'));
const iframe = document.createElement('iframe');
// ... codigo do iframe ...
iframe.contentWindow?.print();

// DEPOIS - nova aba
const blobUrl = String(doc.output('bloburl'));
const printWindow = window.open(blobUrl, '_blank');
if (printWindow) {
  printWindow.onload = () => {
    printWindow.print();
  };
}
```

---

## Arquivos a Modificar

| Arquivo | Linhas | Acao |
|---------|--------|------|
| `src/components/production/OrdemDetalhesSheet.tsx` | 222-266 | Substituir iframe por window.open em `handleImprimirEtiqueta` |
| `src/components/production/OrdemDetalhesSheet.tsx` | 369-407 | Substituir iframe por window.open em `handleImprimirTodasEtiquetas` |

---

## Resultado Esperado

1. Ao clicar no icone de impressora, o PDF abre em uma nova aba
2. O navegador dispara automaticamente o dialogo de impressao
3. O usuario pode imprimir normalmente sem erros de seguranca
4. Se o popup for bloqueado, o usuario pode permitir popups para o site
