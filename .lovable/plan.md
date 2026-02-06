

# Correcao: Layout do Modal de Agendamento - Calendario Muito Grande

## Problema

O calendario (`Calendar` component) dentro do `AdicionarOrdemCalendarioModal` ocupa muito espaco vertical, empurrando os campos de responsavel e o botao de confirmar para fora da area visivel do modal. Como o conteudo nao esta dentro de um `ScrollArea`, o usuario nao consegue acessar os demais inputs.

## Correcao

### Arquivo: `src/components/expedicao/AdicionarOrdemCalendarioModal.tsx`

1. **Envolver a secao de configuracao em ScrollArea**: A area que aparece apos selecionar uma ordem (calendario + tipo responsavel + select) precisa ser scrollavel para caber no modal.

2. **Reduzir o tamanho do calendario**: Aplicar classes CSS para compactar o calendario (`text-xs`, celulas menores com `[&_table]:text-xs [&_td]:p-0 [&_th]:p-0 [&_button]:h-8 [&_button]:w-8`).

3. **Estrutura proposta**:

```
DialogContent (max-h-[90vh])
  DialogHeader
  ScrollArea (flex-1, overflow)
    Busca + Lista de ordens (se nao pre-selecionada)
    Ordem pre-selecionada (se aplicavel)
    Configuracao (quando ordem selecionada):
      Calendar (compacto, ~250px)
      RadioGroup (tipo responsavel)
      Select/Input (responsavel)
  DialogFooter (fixo no fundo)
    Botao Cancelar + Confirmar
```

Mudancas especificas:
- Mover os botoes de acao para fora do `ScrollArea` em um `DialogFooter` fixo
- Envolver todo o conteudo (busca + configuracao) em um unico `ScrollArea`
- Reduzir padding e tamanho das celulas do calendario com classes utilitarias
- Limitar altura do calendario com `[&_.rdp]:text-sm` e celulas de 32px

### Resultado Esperado

- O calendario aparece em tamanho compacto dentro do modal
- O usuario consegue rolar para ver todos os campos do formulario
- Os botoes de acao ficam sempre visiveis no rodape do modal
