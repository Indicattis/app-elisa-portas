
# Plano: Layout Mobile e Correção do Cronômetro

## Problema 1: Layout não está otimizado para mobile

A tabela atual tem 6 colunas que não cabem bem em telas pequenas:
- SKU
- Produto
- Categoria  
- Qtd. Sistema
- Qtd. Conferida (input)
- Diferença

## Problema 2: Cronômetro não está funcionando

O bug está na lógica dos useEffects que iniciam o cronômetro:

```typescript
// O callback `start` muda de referência quando startTime muda
const start = useCallback(() => {
  setIsRunning(true);
  if (!startTime) {
    setStartTime(new Date()); // Isso muda startTime
  }
}, [startTime]); // <-- Dependência problemática

// Este useEffect re-executa quando `start` muda referência
useEffect(() => {
  if (conferencia && conferenciaCarregada && !conferencia.pausada && !isRunning) {
    start();
  }
}, [conferencia, conferenciaCarregada, isRunning, start]); // <-- start está aqui
```

Quando `start()` é chamado e seta `startTime`, a referência de `start` muda, causando possíveis re-renders e comportamento instável.

---

## Solução

### 1. Layout Mobile Responsivo

Usar `useIsMobile()` e classes CSS responsivas para:

**Mobile (< 768px)**:
- 3 colunas: Produto, Qtd. Atual, Input
- Fontes menores (text-xs, text-sm)
- Inputs compactos

**Desktop (>= 768px)**:
- Layout completo com todas as 6 colunas

```tsx
// Colunas responsivas
<TableHead className="hidden md:table-cell">SKU</TableHead>
<TableHead>Produto</TableHead>
<TableHead className="hidden md:table-cell">Categoria</TableHead>
<TableHead className="text-center">Atual</TableHead>
<TableHead className="text-center">Conferida</TableHead>
<TableHead className="hidden md:table-cell text-center">Dif.</TableHead>
```

### 2. Correção do Cronômetro

Remover `startTime` da dependência do `start` usando `useRef`:

```typescript
// useCronometro.ts - versão corrigida
export function useCronometro() {
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isRunning) {
      intervalId = setInterval(() => {
        setSegundosDecorridos(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning]);

  // start agora é estável (sem dependências que mudam)
  const start = useCallback(() => {
    setIsRunning(true);
    if (!startTimeRef.current) {
      startTimeRef.current = new Date();
    }
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSegundosDecorridos(0);
    startTimeRef.current = null;
  }, []);

  return {
    segundosDecorridos,
    isRunning,
    startTime: startTimeRef.current,
    start,
    pause,
    reset
  };
}
```

E simplificar o useEffect na página:

```typescript
// ConferenciaExecucao.tsx
// Usar ref para evitar múltiplas inicializações
const cronometroIniciado = useRef(false);

useEffect(() => {
  if (conferencia && conferenciaCarregada && !cronometroIniciado.current) {
    if (conferencia.pausada) {
      retomarConferencia(conferenciaId!);
    }
    start();
    cronometroIniciado.current = true;
  }
}, [conferencia, conferenciaCarregada]);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useCronometro.ts` | Usar useRef para startTime, callbacks estáveis |
| `src/pages/estoque/ConferenciaExecucao.tsx` | Layout responsivo + correção useEffect |

---

## Resultado Visual (Mobile)

```text
┌────────────────────────────────┐
│ ← Conf. #06bcdfe4   00:05:23  │
│ ████████████░░░░░░  12/20 60% │
│ [Pausar] [Concluir]           │
│ 🔍 Buscar...                  │
├────────────────────────────────┤
│ Produto          │ Atual │ ▢  │
├────────────────────────────────┤
│ Mesa Redonda     │  15   │[__]│
│ Cadeira Estofada │   8   │[__]│
│ Banco de Madeira │  22   │[__]│
└────────────────────────────────┘
```

Fontes reduzidas: títulos text-sm, células text-xs, inputs h-7.
