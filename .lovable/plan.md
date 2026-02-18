

# Alteracoes na tela de detalhes da ordem (perfiladeira)

## 1. Remover botao "Imprimir Todas"

Remover o botao "Imprimir Todas" que aparece ao lado do titulo "Itens de Producao" no sheet de detalhes da ordem.

**Arquivo:** `src/components/production/OrdemDetalhesSheet.tsx` (linhas 795-806)

## 2. Bloqueio sequencial das linhas (checklist progressivo)

Implementar logica onde as linhas so podem ser marcadas em sequencia:
- Apenas a primeira linha de cada grupo (porta) comeca desbloqueada
- Ao marcar uma linha como concluida, a proxima linha e liberada
- Desmarcar uma linha bloqueia todas as posteriores

**Arquivo:** `src/components/production/OrdemDetalhesSheet.tsx` (linha 924)

### Logica

Dentro do loop `linhasPorta.map((linha, indexLinha))`, calcular se a linha anterior esta concluida:

```typescript
const linhaAnteriorConcluida = indexLinha === 0 || linhasPorta[indexLinha - 1].concluida;
```

Adicionar essa condicao ao `disabled` do Checkbox existente:

```typescript
disabled={
  ordem.status === 'concluido' || 
  ordem.status === 'pronta' || 
  isUpdating || 
  !podeMarcarLinhas || 
  (tipoOrdem === 'qualidade' && linha.com_problema) ||
  !linhaAnteriorConcluida
}
```

Isso garante que:
- A primeira linha (index 0) esta sempre disponivel (desde que as outras condicoes permitam)
- Cada linha subsequente so e habilitada quando a anterior estiver marcada como concluida
- Desmarcar uma linha automaticamente impede marcar as seguintes (pois a condicao volta a ser falsa)

### Visual

Linhas bloqueadas ja ficam com `opacity-50` e `cursor-not-allowed` pelo estilo padrao do Checkbox desabilitado, entao nao e necessario adicionar estilos extras.

## Resumo das alteracoes

Um unico arquivo modificado: `src/components/production/OrdemDetalhesSheet.tsx`
- Remover bloco do botao "Imprimir Todas" (linhas 795-806)
- Adicionar `indexLinha` ao `.map()` e condicao de bloqueio sequencial ao Checkbox (linha 907 e 924)

