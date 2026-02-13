
# Remover funcionalidade de pausar ordem da Qualidade

## Problema
Atualmente, a pagina `/producao/qualidade` (e sua versao minimalista) permite pausar ordens via o botao "Aviso de Falta". Essa funcionalidade deve ser removida apenas para o setor de qualidade.

## Solucao

Remover a prop `onPausarOrdem` e `isPausing` dos componentes de qualidade, e ajustar a condicao no `OrdemDetalhesSheet` para nao exibir o botao/modal de pausa quando `tipoOrdem === 'qualidade'`.

## Detalhes tecnicos

### 1. `src/pages/ProducaoQualidade.tsx`
- Remover as props `onPausarOrdem` e `isPausing` do `<OrdemDetalhesSheet>`

### 2. `src/pages/fabrica/producao/QualidadeMinimalista.tsx`
- Remover as props `onPausarOrdem` e `isPausing` do `<OrdemDetalhesSheet>`

### 3. `src/components/production/OrdemDetalhesSheet.tsx`
- Na condicao do botao "Aviso de Falta" (linha 1068), remover `tipoOrdem === 'qualidade'` da lista de tipos permitidos
- Na condicao do modal `AvisoFaltaModal` (linha 1110), remover `tipoOrdem === 'qualidade'` da lista de tipos permitidos

Ambas as condicoes passam de:
```
(tipoOrdem === 'separacao' || tipoOrdem === 'perfiladeira' || tipoOrdem === 'soldagem' || tipoOrdem === 'qualidade')
```
para:
```
(tipoOrdem === 'separacao' || tipoOrdem === 'perfiladeira' || tipoOrdem === 'soldagem')
```

### Arquivos editados
1. `src/pages/ProducaoQualidade.tsx`
2. `src/pages/fabrica/producao/QualidadeMinimalista.tsx`
3. `src/components/production/OrdemDetalhesSheet.tsx`
