

# Permitir excluir parcelas individuais

## Problema

Atualmente, o botao de excluir (lixeira) no header da secao de parcelas so remove a ultima parcela pendente. Nao ha como excluir uma parcela especifica a partir do seu card individual.

## Solucao

### Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

1. **Adicionar botao de excluir em cada card de parcela**: Inserir um pequeno icone de lixeira (Trash2) no canto superior direito de cada card de parcela (ao lado do badge de status). Ao clicar, o `confirmRemoveId` sera definido com o ID daquela parcela, abrindo o AlertDialog de confirmacao ja existente.

2. **Atualizar a descricao do AlertDialog**: Trocar o texto "A ultima parcela pendente sera removida" por "A parcela selecionada sera removida permanentemente."

3. **Manter o botao de lixeira do header**: O botao no header continuara removendo a ultima parcela pendente como atalho rapido. Ambos os caminhos usam o mesmo `handleRemoveParcela` e o mesmo dialog de confirmacao.

### Mudanca visual no card da parcela

Cada card passara de:
```text
[Parcela 1]  [Pendente]
R$ 1.000,00
[Data vencimento]
```

Para:
```text
[Parcela 1]  [Pendente] [lixeira]
R$ 1.000,00
[Data vencimento]
```

O icone de lixeira sera discreto (text-red-400/50, hover:text-red-400) e tera tamanho h-3 w-3 para nao poluir o card.

