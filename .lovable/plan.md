

## Plan: Melhorar design dos botões do header no Organograma RH

Atualizar os botões "Nova Função" e "Nova Vaga" no header de `GestaoColaboradoresDirecao.tsx` para seguir o mesmo padrão visual dos botões em `MinhasVendas.tsx` — com gradientes, sombras coloridas, e efeito de hover com scale.

### Mudança em `src/pages/direcao/GestaoColaboradoresDirecao.tsx` (linhas 163-181)

Substituir os `<Button>` do shadcn por `<button>` nativos com o estilo gradient:

```tsx
<div className="flex items-center gap-2">
  <button
    onClick={() => setCreateRoleModalOpen(true)}
    className="h-10 px-5 rounded-lg font-medium text-white border
               bg-gradient-to-r from-purple-500 to-purple-700 border-purple-400/30
               shadow-lg shadow-purple-500/30
               hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/40
               transition-all duration-200 flex items-center gap-2"
  >
    <Plus className="w-4 h-4" />
    Nova Função
  </button>
  <button
    onClick={() => { setVagaDialogOpen(true); setVagaDialogRole(''); setVagaJustificativa(''); }}
    className="h-10 px-5 rounded-lg font-medium text-white border
               bg-gradient-to-r from-blue-500 to-blue-700 border-blue-400/30
               shadow-lg shadow-blue-500/30
               hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40
               transition-all duration-200 flex items-center gap-2"
  >
    <Plus className="w-4 h-4" />
    Nova Vaga
  </button>
</div>
```

Um único arquivo alterado.

