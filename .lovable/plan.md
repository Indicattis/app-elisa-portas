

# Plano: Adicionar Upload de Comprovante na Pagina de Edicao de Venda

## Objetivo

Permitir que o usuario anexe um comprovante de pagamento diretamente na pagina de edicao de venda (`/vendas/minhas-vendas/editar/:id`), caso ainda nao tenha anexado.

---

## Analise

### Recursos Existentes

1. **Componente pronto**: `ComprovanteUploadModal` em `src/components/vendas/ComprovanteUploadModal.tsx`
   - Suporta upload de PNG, JPG e PDF (max 10MB)
   - Faz upload para o bucket `comprovantes-pagamento`
   - Atualiza campos `comprovante_url` e `comprovante_nome` na tabela `vendas`
   - Permite visualizar, substituir e remover comprovantes

2. **Campos no banco**: A tabela `vendas` ja possui:
   - `comprovante_url` (text)
   - `comprovante_nome` (text)

3. **Dados carregados**: A pagina `MinhasVendasEditar` ja carrega a venda completa incluindo esses campos

---

## Solucao

Adicionar uma secao na area de "Dados da Venda" ou no final do card para mostrar o comprovante (se existir) ou um botao para anexar.

### Alteracoes em MinhasVendasEditar.tsx

1. **Importar** o componente `ComprovanteUploadModal` e icones necessarios (`Paperclip`, `FileText`, `ExternalLink`)

2. **Adicionar estado** para controlar a abertura do modal:
   ```typescript
   const [comprovanteModalOpen, setComprovanteModalOpen] = useState(false);
   ```

3. **Adicionar secao de Comprovante** no card de "Dados da Venda", apos as observacoes:
   - Se nao tem comprovante: mostrar botao "Anexar Comprovante"
   - Se tem comprovante: mostrar preview com link para abrir e botao para editar

4. **Adicionar o modal** `ComprovanteUploadModal` passando os dados da venda

---

## Layout Proposto

Dentro do card "Dados da Venda", apos a secao de Observacoes:

```
┌─────────────────────────────────────────────────┐
│  📎 Comprovante de Pagamento                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Se nao tem comprovante]                       │
│  ┌─────────────────────────────┐                │
│  │  📎 Anexar Comprovante      │                │
│  └─────────────────────────────┘                │
│                                                 │
│  [Se tem comprovante]                           │
│  ┌─────────────────────────────────────┐        │
│  │ 📄 nome_do_arquivo.pdf              │        │
│  │ [Abrir] [Alterar]                   │        │
│  └─────────────────────────────────────┘        │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/vendas/MinhasVendasEditar.tsx` | Importar modal, adicionar estado, adicionar secao de comprovante |

---

## Codigo da Secao de Comprovante

```tsx
{/* Comprovante de Pagamento */}
<div className="mt-6 pt-4 border-t border-blue-500/20">
  <div className="flex items-center gap-2 text-sm font-medium text-blue-300/70 mb-3">
    <Paperclip className="h-4 w-4" />
    Comprovante de Pagamento
  </div>
  
  {venda.comprovante_url ? (
    <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
      <FileText className="h-5 w-5 text-blue-300" />
      <span className="text-sm text-blue-100 truncate flex-1">
        {venda.comprovante_nome || 'Comprovante'}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => window.open(venda.comprovante_url!, '_blank')}
        className="text-blue-300 hover:text-blue-100"
      >
        <ExternalLink className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setComprovanteModalOpen(true)}
        className="text-blue-300 hover:text-blue-100"
      >
        Alterar
      </Button>
    </div>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setComprovanteModalOpen(true)}
      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
    >
      <Paperclip className="h-4 w-4 mr-2" />
      Anexar Comprovante
    </Button>
  )}
</div>

{/* Modal de Comprovante */}
<ComprovanteUploadModal
  open={comprovanteModalOpen}
  onOpenChange={(open) => {
    setComprovanteModalOpen(open);
    if (!open) fetchVenda(); // Recarregar dados apos fechar
  }}
  venda={venda ? {
    id: venda.id,
    cliente_nome: venda.cliente_nome || '',
    comprovante_url: venda.comprovante_url,
    comprovante_nome: venda.comprovante_nome
  } : null}
/>
```

---

## Resultado Esperado

- Usuario pode anexar comprovante de pagamento na edicao da venda
- Se ja existe comprovante, pode visualizar ou substituir
- Usa o mesmo componente/fluxo ja existente em outras partes do sistema
- Estilo visual consistente com o tema azul da area de vendas

