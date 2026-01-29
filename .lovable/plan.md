

# Plano: Pausar Cronômetro Fora do Horário de Expediente

## Objetivo

Criar um sistema que **calcula apenas o tempo trabalhado dentro do expediente** (7h às 17h, horário de Brasília), ignorando o tempo noturno e finais de semana automaticamente.

---

## Problema Atual

Atualmente, o cronômetro conta o tempo de forma contínua desde `capturada_em` até o momento atual. Se um colaborador captura uma ordem às 16h e só retoma às 8h do dia seguinte, o cronômetro mostra 16 horas de trabalho, quando na verdade foram apenas 1h (16h-17h do dia anterior).

---

## Solução Proposta

Criar uma função utilitária que calcula apenas as horas dentro do expediente entre duas datas, descartando:
- Tempo entre 17h e 7h (noite)
- Finais de semana (opcional, configurável)

Essa função será usada em:
1. `useCronometroOrdem.ts` - Para exibição em tempo real
2. `useOrdemProducao.ts` - Para cálculo do `tempo_conclusao_segundos` ao concluir
3. `useOrdemProducao.ts` - Para cálculo do `tempo_acumulado_segundos` ao pausar

---

## Detalhes Técnicos

### Nova Função: `calcularTempoExpediente`

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `inicio` | `Date` | Data/hora de início (capturada_em) |
| `fim` | `Date` | Data/hora de fim (agora ou data_conclusao) |
| `horaInicio` | `number` | Hora início expediente (default: 7) |
| `horaFim` | `number` | Hora fim expediente (default: 17) |
| `incluirFimDeSemana` | `boolean` | Se deve contar sábado/domingo (default: false) |

**Retorno:** Número de segundos trabalhados dentro do expediente

### Lógica do Algoritmo

```text
1. Converter ambas as datas para timezone de Brasília (America/Sao_Paulo)
2. Para cada dia entre início e fim:
   a. Se for fim de semana e !incluirFimDeSemana → pular
   b. Calcular hora de início efetiva: max(horaInicio, hora real de início)
   c. Calcular hora de fim efetiva: min(horaFim, hora real de fim)
   d. Se início efetivo < fim efetivo → somar diferença
3. Retornar total de segundos
```

### Exemplo Visual

```text
Ordem capturada: 16:30 (segunda)
Ordem concluída: 09:15 (terça)

Tempo bruto: 16h 45min
Tempo expediente:
  - Segunda: 16:30 → 17:00 = 30min
  - Terça: 07:00 → 09:15 = 2h 15min
  Total: 2h 45min ✓
```

---

## Arquivos a Criar/Modificar

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/utils/calcularTempoExpediente.ts` | **Criar** | Função utilitária para calcular tempo de expediente |
| `src/hooks/useCronometroOrdem.ts` | Editar | Usar nova função no cálculo em tempo real |
| `src/hooks/useOrdemProducao.ts` | Editar | Usar nova função em pausarOrdem e concluirOrdem |
| `src/hooks/useCronometroEtapa.ts` | Editar | Usar nova função (opcional, para etapas de pedido) |

---

## Código: calcularTempoExpediente.ts

```typescript
import { toZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Sao_Paulo';

interface ConfigExpediente {
  horaInicio?: number;  // Default: 7
  horaFim?: number;     // Default: 17
  incluirSabado?: boolean;
  incluirDomingo?: boolean;
}

/**
 * Calcula o tempo decorrido apenas durante o horário de expediente
 * @param inicio Data/hora de início
 * @param fim Data/hora de fim (default: agora)
 * @param config Configurações do expediente
 * @returns Segundos trabalhados dentro do expediente
 */
export function calcularTempoExpediente(
  inicio: Date,
  fim: Date = new Date(),
  config: ConfigExpediente = {}
): number {
  const {
    horaInicio = 7,
    horaFim = 17,
    incluirSabado = false,
    incluirDomingo = false,
  } = config;

  // Converter para timezone de Brasília
  const inicioBrasil = toZonedTime(inicio, TIMEZONE);
  const fimBrasil = toZonedTime(fim, TIMEZONE);

  let segundosTotais = 0;

  // Clonar data inicial para iteração
  let diaAtual = new Date(inicioBrasil);
  diaAtual.setHours(0, 0, 0, 0);

  const diaFinal = new Date(fimBrasil);
  diaFinal.setHours(23, 59, 59, 999);

  while (diaAtual <= diaFinal) {
    const diaSemana = diaAtual.getDay();
    
    // Verificar se é dia útil
    const ehDomingo = diaSemana === 0;
    const ehSabado = diaSemana === 6;
    
    if ((ehDomingo && !incluirDomingo) || (ehSabado && !incluirSabado)) {
      diaAtual.setDate(diaAtual.getDate() + 1);
      continue;
    }

    // Definir início e fim do expediente para este dia
    const inicioExpediente = new Date(diaAtual);
    inicioExpediente.setHours(horaInicio, 0, 0, 0);
    
    const fimExpediente = new Date(diaAtual);
    fimExpediente.setHours(horaFim, 0, 0, 0);

    // Calcular intervalo efetivo de trabalho neste dia
    const inicioEfetivo = new Date(Math.max(
      inicioExpediente.getTime(),
      inicioBrasil.getTime()
    ));
    
    const fimEfetivo = new Date(Math.min(
      fimExpediente.getTime(),
      fimBrasil.getTime()
    ));

    // Se há trabalho válido neste dia
    if (inicioEfetivo < fimEfetivo) {
      const segundosDia = Math.floor(
        (fimEfetivo.getTime() - inicioEfetivo.getTime()) / 1000
      );
      segundosTotais += segundosDia;
    }

    diaAtual.setDate(diaAtual.getDate() + 1);
  }

  return segundosTotais;
}

/**
 * Verifica se está dentro do horário de expediente
 */
export function estaNoExpediente(
  data: Date = new Date(),
  config: ConfigExpediente = {}
): boolean {
  const { horaInicio = 7, horaFim = 17, incluirSabado = false, incluirDomingo = false } = config;
  
  const dataBrasil = toZonedTime(data, TIMEZONE);
  const hora = dataBrasil.getHours();
  const diaSemana = dataBrasil.getDay();
  
  const ehDomingo = diaSemana === 0;
  const ehSabado = diaSemana === 6;
  
  if ((ehDomingo && !incluirDomingo) || (ehSabado && !incluirSabado)) {
    return false;
  }
  
  return hora >= horaInicio && hora < horaFim;
}
```

---

## Alterações em useCronometroOrdem.ts

```typescript
import { calcularTempoExpediente, estaNoExpediente } from '@/utils/calcularTempoExpediente';

// Na função calcularTempo:
const calcularTempo = () => {
  const agora = new Date();
  const inicio = new Date(capturadaEm as string);

  // Calcular tempo apenas dentro do expediente
  const segundosSessao = calcularTempoExpediente(inicio, agora);
  const segundosTotal = (tempoAcumulado || 0) + segundosSessao;
  
  const formatado = formatCronometroExtended(segundosTotal);
  setTempoDecorrido(formatado);
  
  // Animar apenas se estiver no expediente
  setDeveAnimar(estaNoExpediente());
};
```

---

## Alterações em useOrdemProducao.ts

### Em `pausarOrdem`:
```typescript
// Calcular tempo trabalhado nesta sessão (apenas expediente)
let tempoSessao = 0;
if (ordem.capturada_em) {
  tempoSessao = calcularTempoExpediente(
    new Date(ordem.capturada_em),
    new Date()
  );
}

const tempoTotal = (ordem.tempo_acumulado_segundos || 0) + tempoSessao;
```

### Em `concluirOrdem`:
```typescript
// Calcular tempo de conclusão (apenas expediente)
let tempo_conclusao_segundos = null;
if (ordem.capturada_em) {
  const tempoSessao = calcularTempoExpediente(
    new Date(ordem.capturada_em),
    new Date()
  );
  tempo_conclusao_segundos = (ordem.tempo_acumulado_segundos || 0) + tempoSessao;
}
```

---

## Indicador Visual de "Fora do Expediente"

Opcionalmente, podemos adicionar um indicador visual quando o cronômetro está pausado por estar fora do expediente:

```text
┌────────────────────────────┐
│  ⏸️ 02:45:30               │
│  Fora do expediente        │
│  Retoma às 07:00           │
└────────────────────────────┘
```

Isso será implementado no componente que renderiza o cronômetro, usando a função `estaNoExpediente()`.

---

## Resumo das Alterações

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `src/utils/calcularTempoExpediente.ts` | Criar | Função de cálculo de tempo em expediente |
| `src/hooks/useCronometroOrdem.ts` | Editar | Usar cálculo de expediente na exibição |
| `src/hooks/useOrdemProducao.ts` | Editar | Usar cálculo em pausar e concluir |

---

## Dependências

O projeto já possui `date-fns-tz` instalado (versão 3.2.0), portanto não há necessidade de instalar novas dependências.

---

## Resultado Esperado

1. Cronômetro conta apenas tempo dentro do horário de expediente (7h-17h)
2. Fora do expediente, cronômetro para de animar e mostra tempo acumulado
3. Ao concluir/pausar, tempo registrado reflete apenas horas úteis trabalhadas
4. Finais de semana não são contabilizados por padrão
5. Indicador visual opcional quando fora do expediente

