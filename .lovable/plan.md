
# Plano: Melhorar Inputs de Frete e Previsão de Entrega

## Problema Identificado

Em `/vendas/minhas-vendas/nova`, os campos de "Frete" e "Previsão de Entrega" estão com implementação básica:

```tsx
// Frete: Input numérico simples
<Input type="number" value={formData.valor_frete} ... />

// Previsão Entrega: Input date nativo (inconsistente com o resto do sistema)
<Input type="date" value={formData.data_prevista_entrega} ... />
```

---

## Solução Proposta

### 1. Campo de Frete Sofisticado

Criar um componente com:
- **Sugestão automática** baseada na cidade/estado selecionados (usando `frete_cidades`)
- **Ícone de caminhão** para indicar visualmente o campo
- **Badge de sugestão** quando houver frete cadastrado para a localização
- **Botão "Usar sugestão"** para aplicar o valor automaticamente
- **Fallback** para digitação manual quando não houver sugestão

```text
┌──────────────────────────────────────────────────────┐
│ FRETE (R$)                                           │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🚚  350,00                              [Editar] │ │
│ └──────────────────────────────────────────────────┘ │
│  💡 Sugerido: R$ 350,00 (Curitiba/PR)  [Usar]       │
└──────────────────────────────────────────────────────┘
```

### 2. Campo de Previsão de Entrega com Calendar Popover

Substituir o input date nativo por um Popover + Calendar estilizado, consistente com o resto do sistema:

```text
┌──────────────────────────────────────────────────────┐
│ PREVISÃO ENTREGA *                                   │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 📅  15/02/2026                          [▼]      │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─ Calendário (Popover) ───────────────────────────┐ │
│ │        Janeiro 2026                              │ │
│ │  D   S   T   Q   Q   S   S                       │ │
│ │              1   2   3   4                       │ │
│ │  5   6   7   8   9  10  11                       │ │
│ │ ...                                              │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## Alterações Técnicas

### Arquivo: `src/pages/vendas/VendaNovaMinimalista.tsx`

#### Importações Adicionais
```tsx
import { useFretesCidades } from '@/hooks/useFretesCidades';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
```

#### Novo Estado e Hook
```tsx
const { fretes } = useFretesCidades();
const [dataEntrega, setDataEntrega] = useState<Date | undefined>();
```

#### Lógica de Sugestão de Frete
```tsx
const freteSugerido = useMemo(() => {
  if (!formData.estado || !formData.cidade || !fretes) return null;
  return fretes.find(
    f => f.ativo && 
         f.estado === formData.estado && 
         f.cidade === formData.cidade
  );
}, [formData.estado, formData.cidade, fretes]);
```

#### Novo Campo de Frete (substituir linhas 779-791)
```tsx
<div className="space-y-2">
  <Label htmlFor="valor_frete" className={labelClass}>Frete (R$)</Label>
  <div className="relative">
    <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400/60" />
    <Input
      id="valor_frete"
      type="number"
      step="0.01"
      min="0"
      value={formData.valor_frete}
      onChange={(e) => setFormData(prev => ({ 
        ...prev, 
        valor_frete: parseFloat(e.target.value) || 0 
      }))}
      placeholder="0,00"
      className={cn(inputClass, "pl-10")}
    />
  </div>
  {freteSugerido && formData.valor_frete !== freteSugerido.valor_frete && (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-300">
        💡 Sugerido: R$ {freteSugerido.valor_frete.toFixed(2)}
      </Badge>
      <Button 
        type="button"
        variant="ghost" 
        size="sm"
        className="h-6 text-xs text-blue-400 hover:text-blue-300"
        onClick={() => setFormData(prev => ({ 
          ...prev, 
          valor_frete: freteSugerido.valor_frete 
        }))}
      >
        Usar
      </Button>
    </div>
  )}
</div>
```

#### Novo Campo de Previsão de Entrega (substituir linhas 793-804)
```tsx
<div className="space-y-2">
  <Label className={labelClass}>Previsão Entrega *</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          inputClass,
          !dataEntrega && "text-blue-200/30"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-blue-400/60" />
        {dataEntrega ? (
          format(dataEntrega, "dd/MM/yyyy", { locale: ptBR })
        ) : (
          <span>Selecione uma data</span>
        )}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0 bg-zinc-900 border-blue-500/20" align="start">
      <Calendar
        mode="single"
        selected={dataEntrega}
        onSelect={(date) => {
          setDataEntrega(date);
          setFormData(prev => ({
            ...prev,
            data_prevista_entrega: date ? format(date, 'yyyy-MM-dd') : ''
          }));
        }}
        disabled={(date) => date < new Date()}
        initialFocus
        className="pointer-events-auto"
      />
    </PopoverContent>
  </Popover>
</div>
```

---

## Comportamentos Implementados

| Feature | Descrição |
|---------|-----------|
| **Sugestão de Frete** | Ao selecionar cidade/estado, busca na tabela `frete_cidades` e exibe sugestão |
| **Aplicar Sugestão** | Botão "Usar" preenche o campo automaticamente |
| **Frete Manual** | Usuário pode digitar qualquer valor mesmo com sugestão |
| **Calendar Popover** | Substitui input date nativo por componente estilizado |
| **Datas Futuras** | Calendar bloqueia datas passadas (disabled prop) |
| **Ícones Visuais** | Truck para frete, CalendarIcon para data |
| **Tema Consistente** | Mantém o tema azul sofisticado da página |

---

## Resultado Visual Esperado

```text
ANTES (simples):
┌─────────────────────┐  ┌─────────────────────┐
│ Frete (R$)          │  │ Previsão Entrega    │
│ [ 0,00          ]   │  │ [ ____-__-__ ]      │  <- Input date nativo
└─────────────────────┘  └─────────────────────┘

DEPOIS (sofisticado):
┌───────────────────────────────────┐  ┌───────────────────────────────────┐
│ FRETE (R$)                        │  │ PREVISÃO ENTREGA *                │
│ ┌───────────────────────────────┐ │  │ ┌───────────────────────────────┐ │
│ │ 🚚  350,00                    │ │  │ │ 📅  15/02/2026              ▼│ │
│ └───────────────────────────────┘ │  │ └───────────────────────────────┘ │
│ 💡 Sugerido: R$ 350 (Curitiba) ↗  │  │                                   │
└───────────────────────────────────┘  └───────────────────────────────────┘
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/vendas/VendaNovaMinimalista.tsx` | Adicionar hook useFretesCidades, criar lógica de sugestão, substituir inputs por versões sofisticadas |

---

## Impacto

- **UX**: Inputs visualmente mais atrativos e consistentes com o resto do sistema
- **Produtividade**: Sugestão automática de frete economiza tempo do vendedor
- **Consistência**: Mesmo padrão de Calendar usado em outras páginas
- **Dados**: Aproveita a tabela `frete_cidades` já existente
