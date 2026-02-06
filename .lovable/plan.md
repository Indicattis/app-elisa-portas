
# Redesign Minimalista do Modal "Adicionar ao Calendario"

## Problema

O Select de equipe/autorizado nao aparece corretamente porque o dropdown do Radix Select e cortado pelo `ScrollArea` com `max-h-[60vh]` e pelo `overflow` do `DialogContent`. Alem disso, o modal esta visualmente carregado e nao segue o padrao minimalista das demais paginas.

## Solucao

Redesenhar o modal inteiro com layout limpo, responsivo e funcional, corrigindo o problema do Select.

## Alteracoes no arquivo `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx`

### 1. Corrigir o Select cortado
- Remover o `ScrollArea` que envolve todo o conteudo (causa overflow:hidden que corta o dropdown)
- Usar `overflow-y-auto` diretamente no container interno
- Adicionar `position: "popper"` e `sideOffset` no `SelectContent` para garantir que o dropdown renderize fora do container

### 2. Layout minimalista e responsivo
- Usar `max-w-[95vw] sm:max-w-[500px]` para responsividade mobile
- Remover o calendario inline (ocupa muito espaco) e substituir por um input date simples, mantendo a politica date-only (hora fixa "08:00")
- Simplificar o header: titulo menor, sem descricao verbosa
- Usar espacamento reduzido (`space-y-3` em vez de `space-y-4`)
- Cards de ordem mais compactos com hover sutil
- Botoes de acao com estilo mais limpo

### 3. Estrutura final do modal

```
Dialog
  DialogContent (max-w-[95vw] sm:max-w-[500px], max-h-[85vh], flex flex-col)
    DialogHeader (titulo simples)
    div (overflow-y-auto, flex-1, space-y-3)
      [Se sem pre-selecao] Input de busca + lista de ordens com scroll interno
      [Se com pre-selecao] Card compacto da ordem
      [Se ordem selecionada] Secao de configuracao:
        - Input type="date" (simples, sem calendario inline)
        - Toggle buttons para tipo (Elisa / Autorizado ou Terceiro)
        - Select do responsavel (com portal para evitar corte)
    div (footer fixo com botoes)
```

### 4. Tipo de responsavel: toggle buttons em vez de RadioGroup
- Substituir RadioGroup por botoes toggle lado a lado (estilo pill/segmented control)
- Visual mais moderno e intuitivo

### 5. Select com portal
- Usar a prop `container` ou garantir que o `SelectContent` tenha `position="popper"` com `className="z-[200]"` para renderizar acima do dialog

## Resultado

- Modal compacto, responsivo, minimalista
- Select de equipe/autorizado visivel e funcional
- Funciona bem em mobile e desktop
- 1 arquivo modificado: `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx`
