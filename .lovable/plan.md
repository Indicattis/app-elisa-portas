

## Plano: Downbar para Instalacoes e Remover Campo Hora

### Objetivo
1. Fazer o icone de informacao (Info) abrir uma downbar (Sheet inferior) ao inves da sidebar lateral direita
2. Remover a informacao de hora na criacao, edicao e exibicao das instalacoes avulsas

---

### Mudanca 1: Converter NeoInstalacaoDetails para Downbar

**Arquivo:** `src/components/expedicao/NeoInstalacaoDetails.tsx`

Alterar o componente Sheet para usar `side="bottom"` e ajustar o layout para funcionar como downbar:

```tsx
// ANTES
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="w-full sm:max-w-md overflow-y-auto">

// DEPOIS
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl max-w-[700px] mx-auto overflow-y-auto">
```

Tambem remover a exibicao da hora na secao "Data e Hora":

```tsx
// REMOVER este bloco:
{neoInstalacao.hora && (
  <p className="text-sm text-muted-foreground flex items-center gap-1">
    <Clock className="h-3 w-3" />
    {neoInstalacao.hora.substring(0, 5)}
  </p>
)}
```

Remover import do Clock se nao for mais usado.

---

### Mudanca 2: Remover Campo Hora do Modal de Criacao/Edicao

**Arquivo:** `src/components/expedicao/NeoInstalacaoModal.tsx`

Remover todo o bloco de input de horario:

```tsx
// REMOVER (linhas 246-255):
<div className="space-y-2">
  <Label htmlFor="hora">Horário <span className="text-muted-foreground text-xs">(opcional)</span></Label>
  <Input
    id="hora"
    type="time"
    value={hora}
    onChange={(e) => setHora(e.target.value)}
  />
</div>
```

Ajustar o grid para coluna unica para data:

```tsx
// ANTES
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="dataInstalacao">Data...</Label>
    ...
  </div>
  <div className="space-y-2">
    <Label htmlFor="hora">Horário...</Label>
    ...
  </div>
</div>

// DEPOIS
<div className="space-y-2">
  <Label htmlFor="dataInstalacao">Data <span className="text-muted-foreground text-xs">(opcional)</span></Label>
  <Input
    id="dataInstalacao"
    type="date"
    value={dataInstalacao}
    onChange={(e) => setDataInstalacao(e.target.value)}
  />
</div>
```

Remover estado `hora` e seu reset:

```tsx
// REMOVER:
const [hora, setHora] = useState("");

// E nos useEffects, remover:
setHora(neoInstalacao.hora?.substring(0, 5) || "");
setHora("");
```

Sempre passar `hora: null` nos dados:

```tsx
const dados: CriarNeoInstalacaoData = {
  // ...
  hora: null,  // Sempre null
  // ...
};
```

---

### Mudanca 3: Remover Hora do Tooltip do Card

**Arquivo:** `src/components/expedicao/NeoInstalacaoCard.tsx`

Remover a exibicao da hora no tooltip:

```tsx
// ANTES (linhas 171-176):
{neoInstalacao.data_instalacao && (
  <div className="text-[10px] text-muted-foreground">
    Data: {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}
    {neoInstalacao.hora && ` às ${neoInstalacao.hora.substring(0, 5)}`}
  </div>
)}

// DEPOIS:
{neoInstalacao.data_instalacao && (
  <div className="text-[10px] text-muted-foreground">
    Data: {format(parseISO(neoInstalacao.data_instalacao), "dd/MM/yyyy", { locale: ptBR })}
  </div>
)}
```

---

### Mudanca 4: Atualizar Handlers de Agendamento

**Arquivo:** `src/pages/logistica/ExpedicaoMinimalista.tsx`

Simplificar o handler de agendamento para nao usar hora:

```tsx
// ANTES (linhas 220-221):
const handleAgendarInstalacao = async (id: string, data: string, hora: string) => {
  await updateNeoInstalacaoSemData({ id, data: { data_instalacao: data, hora } });
};

// DEPOIS:
const handleAgendarInstalacao = async (id: string, data: string) => {
  await updateNeoInstalacaoSemData({ id, data: { data_instalacao: data, hora: null } });
};
```

Atualizar tambem os componentes NeoServicosDisponiveis e NeoServicosDisponiveisMobile se necessario.

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/expedicao/NeoInstalacaoDetails.tsx` | Mudar para `side="bottom"`, remover exibicao de hora |
| `src/components/expedicao/NeoInstalacaoModal.tsx` | Remover campo de horario do form |
| `src/components/expedicao/NeoInstalacaoCard.tsx` | Remover hora do tooltip |
| `src/pages/logistica/ExpedicaoMinimalista.tsx` | Simplificar handler de agendamento |
| `src/components/expedicao/NeoServicosDisponiveis.tsx` | Ajustar callback de agendamento |
| `src/components/expedicao/NeoServicosDisponiveisMobile.tsx` | Ajustar callback de agendamento |

---

### Resultado Visual

**Downbar (antes era sidebar lateral):**
```text
+------------------------------------------+
|                                          |
|          [Conteudo da Pagina]            |
|                                          |
+------------------------------------------+
|  +------------------------------------+  |
|  |  ____    Downbar Instalacao        |  |
|  | (__)                               |  |
|  |                                    |  |
|  |  Cliente: Joao Silva               |  |
|  |  Local: Sao Paulo/SP               |  |
|  |  Data: 15/02/2026                  |  |
|  |                                    |  |
|  |  [Editar]  [Concluir Instalacao]   |  |
|  +------------------------------------+  |
+------------------------------------------+
```

**Modal de Criacao (sem hora):**
```text
+----------------------------------+
|   Nova Instalacao Avulsa         |
+----------------------------------+
| Cliente *                        |
| [______________________]         |
|                                  |
| Cidade *         Estado *        |
| [__________]     [UF v]          |
|                                  |
| Data (opcional)                  |
| [__/__/____]                     |
|                                  |
| Tipo de Responsavel *            |
| (o) Equipe Interna               |
| ( ) Autorizado                   |
|                                  |
| Equipe *                         |
| [Selecione a equipe v]           |
|                                  |
| [Cancelar]        [Criar]        |
+----------------------------------+
```

