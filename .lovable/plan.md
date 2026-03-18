

## Diagnóstico: Medidas automáticas não aparecem no modal em alguns dispositivos

### Causa raiz

O `portaSelecionadaKey` é inicializado como `NONE_VALUE` (linha 126) e só é atualizado no `useEffect` (linha 226-242), que roda **após** o primeiro render. Isso causa:

1. Modal abre → `portaSelecionadaKey = NONE_VALUE` → `portaAtual = null`
2. `larguraAtual = portaAtual?.largura ?? portaLargura` — se o modal foi aberto pelo botão global (sem porta específica), `portaLargura` é `undefined`
3. Sem dimensões, `calcularTamanhoAutomatico` e `calcularQuantidadeAutomatica` retornam `null`
4. Preview de medidas não aparece na listagem de produtos
5. Após o `useEffect`, `portaSelecionadaKey` é atualizado para a primeira porta, causando re-render com dados corretos

Em dispositivos rápidos, os passos 1-5 acontecem imperceptivelmente. Em dispositivos lentos, o usuário vê a lista sem previews e possivelmente o produto já foi selecionado antes do re-render corrigir os valores.

Além disso, quando o produto é selecionado durante esse primeiro render (antes do effect), `larguraAtual`/`alturaAtual` são `undefined`, e o item é adicionado **sem medidas nem quantidade calculada**.

### Correção

**Arquivo**: `src/components/pedidos/AdicionarLinhaModal.tsx`

Duas mudanças:

1. **Adicionar fallback para `portas[0]`** nas dimensões, garantindo que mesmo antes do `useEffect` atualizar o key, as dimensões da primeira porta são usadas:

```tsx
// Antes:
const larguraAtual = portaAtual?.largura ?? portaLargura;
const alturaAtual = portaAtual?.altura ?? portaAltura;

// Depois:
const larguraAtual = portaAtual?.largura ?? portaLargura ?? portas[0]?.largura;
const alturaAtual = portaAtual?.altura ?? portaAltura ?? portas[0]?.altura;
```

2. **Usar `useMemo` em vez de `useEffect` + `useState`** para derivar a porta selecionada inicial, eliminando o atraso de 1 render:

```tsx
// Substituir useState + useEffect por:
// - Manter useState para quando o usuário muda manualmente
// - Mas inicializar com useMemo no open
```

Na prática, a correção mais segura e sem risco de regressão é a opção 1 (fallback), que resolve o problema em 2 linhas.

### Arquivo afetado
- `src/components/pedidos/AdicionarLinhaModal.tsx` (linhas 145-146)

