

## Plano: Igualar NeoInstalacaoDetails ao PedidoDetalhesSheet

### Objetivo
Atualizar o componente `NeoInstalacaoDetails` para ter a mesma aparencia visual do `PedidoDetalhesSheet` usado em `/logistica/instalacoes/ordens-instalacoes`.

---

### Diferencas Identificadas

| Aspecto | NeoInstalacaoDetails (Atual) | PedidoDetalhesSheet (Referencia) |
|---------|------------------------------|----------------------------------|
| Altura | `h-[70vh]` | `h-[85vh]` |
| Background | Default | `bg-zinc-900` |
| Border | Default | `border-t border-white/10` |
| Padding | Default | `p-0` com areas internas |
| Header | Simples | Gradiente `from-blue-600/20 to-purple-600/20` com backdrop-blur |
| Secoes | `Separator` simples | Cards com `bg-white/5 rounded-xl border border-white/10` |
| Texto | `text-muted-foreground` | `text-white`, `text-white/60`, etc. |
| Layout | `overflow-y-auto` | `overflow-hidden flex flex-col` com scroll interno |

---

### Mudanca: Atualizar NeoInstalacaoDetails

**Arquivo:** `src/components/expedicao/NeoInstalacaoDetails.tsx`

Reestilizar completamente para seguir o padrao do PedidoDetalhesSheet:

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent 
    side="bottom" 
    className="h-[85vh] max-w-[700px] mx-auto rounded-t-2xl overflow-hidden flex flex-col p-0 bg-zinc-900 border-t border-white/10"
  >
    {/* Header com gradiente */}
    <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-600/20 to-amber-600/20 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <SheetHeader>
        <div className="flex items-center gap-2">
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            Instalacao Avulsa
          </Badge>
          <Badge style={{ backgroundColor: `${corResponsavel}20`, color: corResponsavel }}>
            {nomeResponsavel}
          </Badge>
        </div>
        <SheetTitle className="text-white text-lg">
          {neoInstalacao.nome_cliente}
        </SheetTitle>
      </SheetHeader>
    </div>

    {/* Conteudo scrollavel */}
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Localizacao e Data em card */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-400" />
          <span className="text-sm text-white">{cidade}/{estado}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-purple-400" />
          <span className="text-sm text-white">{data formatada}</span>
        </div>
      </div>

      {/* Responsavel em card */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4">
        <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2">
          {isAutorizado ? "Autorizado Responsavel" : "Equipe Responsavel"}
        </h3>
        <Badge style={...}>{nomeResponsavel}</Badge>
      </div>

      {/* Descricao se existir */}
      {descricao && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <h3 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-2">
            Observacoes
          </h3>
          <p className="text-sm text-white/80">{descricao}</p>
        </div>
      )}

      {/* Metadados */}
      <div className="text-xs text-white/40 space-y-1">
        <p>Criado em: {data}</p>
        <p>Atualizado em: {data}</p>
      </div>
    </div>

    {/* Footer com acoes - fixo no fundo */}
    <div className="sticky bottom-0 bg-zinc-900 border-t border-white/10 px-6 py-4 space-y-2">
      <Button variant="outline" className="w-full bg-white/5 border-white/20 text-white">
        Editar
      </Button>
      <Button className="w-full bg-green-600 hover:bg-green-700">
        Concluir Instalacao
      </Button>
    </div>
  </SheetContent>
</Sheet>
```

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/expedicao/NeoInstalacaoDetails.tsx` | Reestilizar para tema escuro com gradiente e cards |

---

### Resultado Visual

```text
+------------------------------------------+
|  ____  Instalacao Avulsa  [Equipe X]     |  <- Header com gradiente orange
| (__)   Joao Silva                        |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  | 📍 Sao Paulo/SP                    |  |  <- Card bg-white/5
|  | 📅 Quarta, 15 de Fevereiro 2026    |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | EQUIPE RESPONSAVEL                 |  |
|  | [Badge: Instaladores SP]           |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | OBSERVACOES                        |  |
|  | Cliente solicita instalacao...     |  |
|  +------------------------------------+  |
|                                          |
|  Criado em: 10/01/2026 as 14:30         |  <- Metadados
|                                          |
+------------------------------------------+
|  [     Editar     ]                      |  <- Footer fixo
|  [Concluir Instalacao]                   |
+------------------------------------------+
```

