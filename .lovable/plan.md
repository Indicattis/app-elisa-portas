
# Plano: Adicionar Botoes de Conferencia e Auditoria

## Problema 1: Botao de Conferencia em /producao/home

A pagina `ProducaoHome.tsx` carrega rotas dinamicamente do banco de dados. Nao existe um botao fixo para "Conferencia de Estoque".

### Solucao
Adicionar um botao fixo "Conferencia de Estoque" na area de acoes (ao lado de "Meu Historico"), com icone `ClipboardCheck` e navegacao para `/estoque/conferencia`.

---

## Problema 2: Botao de Auditoria em /estoque

A pagina `EstoqueHub.tsx` tem o botao de "Conferencia de Estoque" mas falta um botao para acessar o historico de auditorias em `/estoque/auditoria`.

### Solucao
Adicionar um segundo botao "Auditoria" na secao de conferencia (tanto mobile quanto desktop), com icone `FileSearch` e navegacao para `/estoque/auditoria`.

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/ProducaoHome.tsx` | Adicionar botao "Conferencia de Estoque" |
| `src/pages/estoque/EstoqueHub.tsx` | Adicionar botao "Auditoria de Estoque" |

---

## Alteracao 1: ProducaoHome.tsx

Adicionar importacao do icone e botao na area de acoes:

```tsx
// Importar
import { ClipboardCheck } from "lucide-react";

// Na area de botoes (linha ~105)
<div className="flex gap-2 shrink-0">
  <Button variant="outline" onClick={() => navigate('/estoque/conferencia')}>
    <ClipboardCheck className="h-4 w-4 mr-2" />
    Conferencia de Estoque
  </Button>
  <Button variant="outline" onClick={() => navigate('/producao/meu-historico')}>
    <History className="h-4 w-4 mr-2" />
    Meu Historico
  </Button>
</div>
```

---

## Alteracao 2: EstoqueHub.tsx

Adicionar botao de auditoria ao lado do botao de conferencia:

### Mobile (apos linha ~127)
```tsx
{/* Botao Auditoria - Mobile */}
<div className="p-1.5 rounded-xl backdrop-blur-xl border bg-white/5 border-white/10">
  <button
    onClick={() => navigate('/estoque/auditoria')}
    className="w-full h-12 rounded-lg flex items-center gap-4 px-5
               font-medium border transition-all duration-300
               bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 
               active:scale-[0.98] text-white shadow-lg shadow-amber-500/20 border-amber-400/30"
  >
    <FileSearch className="w-5 h-5" strokeWidth={1.5} />
    <span className="text-sm font-medium flex-1 text-left">Auditoria de Estoque</span>
  </button>
</div>
```

### Desktop (apos linha ~196)
```tsx
{/* Botao Auditoria - Desktop */}
<div className="p-2 rounded-2xl backdrop-blur-xl border bg-white/5 border-white/10">
  <button
    onClick={() => navigate('/estoque/auditoria')}
    className="w-full h-16 rounded-xl flex items-center justify-center gap-3
               font-medium border transition-all duration-300
               bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 
               hover:shadow-xl hover:shadow-amber-500/50 text-white shadow-lg shadow-amber-500/30 border-amber-400/30"
  >
    <FileSearch className="w-6 h-6" strokeWidth={1.5} />
    <span className="text-sm font-medium tracking-wide">Auditoria de Estoque</span>
  </button>
</div>
```

---

## Layout Proposto - /estoque

```text
┌─────────────────────────────────────────────┐
│  [Fabrica]  [Almoxarifado]  [Fornecedores]  │
├─────────────────────────────────────────────┤
│  [🟢 Conferencia de Estoque]                │
│  [🟠 Auditoria de Estoque]                  │
└─────────────────────────────────────────────┘
```

---

## Resultado Esperado

- `/producao/home`: Botao "Conferencia de Estoque" visivel no header
- `/estoque`: Dois botoes - "Conferencia" (verde) e "Auditoria" (amarelo/amber)
- Navegacao consistente entre as paginas
