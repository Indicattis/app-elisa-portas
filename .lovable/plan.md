
# Melhorar exibicao das Ordens de Instalacao

## Resumo
Reorganizar a pagina de Ordens de Instalacao usando Accordion (pastas colapsaveis) onde abrir uma fecha a outra, remover botao de retroceder, mostrar botao de concluir apenas em instalacoes carregadas, e mover finalizados para o topo.

## Mudancas

### 1. Arquivo: `src/pages/logistica/OrdensInstalacoesLogistica.tsx`

**Accordion colapsavel (abrir uma fecha outra)**
- Substituir as 5 secoes fixas por um componente `Accordion` (tipo "single") do Radix, ja disponivel no projeto
- Cada secao vira um `AccordionItem` com trigger mostrando icone + titulo + badge de contagem
- Comportamento "single" garante que ao abrir uma, a outra fecha automaticamente

**Reordenar secoes**
- Mover "Finalizados" para ser o primeiro AccordionItem
- Ordem final: Finalizados, Aguardando Carregamento, Prontas para Instalacao, Instalacoes Avulsas, Correcoes Avulsas

**Remover botao de retroceder**
- Remover o state `retrocederDialog` e a funcao `handleRetroceder`
- Remover o import de `RetrocederPedidoUnificadoModal`
- Remover a prop `onRetroceder` ao renderizar `OrdemInstalacaoRow`
- Remover o componente `RetrocederPedidoUnificadoModal` do JSX

**Botao concluir apenas em carregadas**
- Na secao "Aguardando Carregamento" (`ordensNaoCarregadas`): nao passar `onConcluir` para o `OrdemInstalacaoRow`, fazendo o botao nao aparecer
- Na secao "Prontas para Instalacao" (`ordensCarregadas`): manter `onConcluir` normalmente

### 2. Arquivo: `src/components/instalacoes/OrdemInstalacaoRow.tsx`

- Tornar `onConcluir` opcional (tipo `(ordem: OrdemInstalacao) => void` para `((ordem: OrdemInstalacao) => void) | undefined`)
- Renderizar o botao de concluir condicionalmente apenas quando `onConcluir` for passado
- Remover a prop `onRetroceder` da interface (limpeza)

### Detalhes tecnicos

A estrutura do Accordion ficara assim:

```tsx
<Accordion type="single" collapsible className="space-y-3">
  <AccordionItem value="finalizados">
    <AccordionTrigger>Finalizados (badge)</AccordionTrigger>
    <AccordionContent>...lista...</AccordionContent>
  </AccordionItem>
  <AccordionItem value="aguardando">
    <AccordionTrigger>Aguardando Carregamento (badge)</AccordionTrigger>
    <AccordionContent>...lista...</AccordionContent>
  </AccordionItem>
  <!-- ... demais secoes -->
</Accordion>
```

O tipo "single" com `collapsible` permite que apenas uma secao fique aberta por vez, e clicar na mesma fecha-a.

### Arquivos envolvidos
- `src/pages/logistica/OrdensInstalacoesLogistica.tsx` (reestruturar secoes em Accordion, remover retroceder, reordenar)
- `src/components/instalacoes/OrdemInstalacaoRow.tsx` (tornar onConcluir opcional, remover onRetroceder)
