

# Corrigir logica de verificacao de carregamento para considerar todas as fontes

## Problema
O pedido `08a91857` possui registros em duas tabelas:
- `ordens_carregamento`: `carregamento_concluido = false` (registro antigo)
- `instalacoes`: `carregamento_concluido = true` (carregamento efetivamente concluido)

A logica atual para de buscar ao encontrar o primeiro registro (mesmo com `false`), nunca chegando a verificar a tabela `instalacoes` onde o carregamento esta de fato concluido.

## Solucao
Alterar a logica em ambos os arquivos para consultar TODAS as 3 tabelas e considerar o carregamento como concluido se QUALQUER uma delas tiver `carregamento_concluido = true`.

### Arquivo 1: `src/hooks/usePedidosEtapas.ts` (linhas 597-652)

Remover a logica sequencial com `if (!ordemData)` e substituir por consultas paralelas as 3 tabelas:

```text
// Consultar todas as fontes
const [ordensRes, instRes, corrRes] = await Promise.all([
  supabase.from('ordens_carregamento').select('data_carregamento, carregamento_concluido').eq('pedido_id', pedidoId).order('created_at', { ascending: false }).limit(1),
  supabase.from('instalacoes').select('data_carregamento, carregamento_concluido').eq('pedido_id', pedidoId).order('created_at', { ascending: false }).limit(1),
  supabase.from('correcoes').select('data_carregamento, carregamento_concluido').eq('pedido_id', pedidoId).order('created_at', { ascending: false }).limit(1),
]);

// Verificar se QUALQUER fonte tem carregamento concluido
const todasFontes = [ordensRes.data?.[0], instRes.data?.[0], corrRes.data?.[0]].filter(Boolean);
if (todasFontes.length === 0) throw new Error('Ordem nao encontrada');

const algumaConcluida = todasFontes.some(f => f.carregamento_concluido);
const algumaComData = todasFontes.some(f => f.data_carregamento);

if (!algumaComData) throw new Error('Informe a data...');
if (!algumaConcluida) throw new Error('O carregamento deve ser concluido...');
```

### Arquivo 2: `src/components/pedidos/PedidoCard.tsx` (linhas 1061-1116)

Mesma logica: consultar as 3 tabelas em paralelo e considerar concluido se qualquer fonte tiver `carregamento_concluido = true`.

