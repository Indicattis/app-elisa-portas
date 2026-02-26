

# Editar valores e datas das parcelas no faturamento da venda

## Problema identificado

A venda do cliente Euclesio (R$4.800) possui duas parcelas com valores incorretos: R$2.400 + R$2.800 = R$5.200 (excede o valor da venda). Alem disso, ambas estao numeradas como "Parcela 1". O sistema atual nao permite editar valores nem datas das parcelas nessa pagina.

## Mudancas

### 1. Arquivo: `src/pages/administrativo/FaturamentoVendaMinimalista.tsx`

Transformar os cards de parcelas para permitir edicao inline de **valor** e **data de vencimento**:

- Substituir a exibicao estatica do valor da parcela por um campo `<Input>` numerico editavel
- Substituir a exibicao estatica da data de vencimento por um campo `<Input type="date">` editavel
- Cada campo salva automaticamente no `onBlur` (mesmo padrao ja usado para observacoes)
- Usar a funcao `handleUpdatePagamento` existente (que ja faz update generico por campo) para salvar `valor_parcela` e `data_vencimento`
- Exibir o total do grupo dinamicamente conforme os valores sao editados
- Adicionar um indicador visual (soma das parcelas vs valor da venda) para alertar sobre divergencias

### Detalhes tecnicos

**Campos editaveis no card da parcela:**
- `valor_parcela`: Input numerico, estado local por parcela, salva no blur via `handleUpdatePagamento(parcela.id, 'valor_parcela', valor)`
- `data_vencimento`: Input date, salva no blur via `handleUpdatePagamento(parcela.id, 'data_vencimento', data)`

**Validacao visual:**
- Exibir abaixo da secao de parcelas a comparacao: "Total parcelas: R$X / Valor venda: R$Y"
- Destacar em vermelho se os valores divergem, em verde se batem

**Fluxo de save:**
- A funcao `handleUpdatePagamento` ja aceita qualquer campo e faz update no Supabase + atualiza o estado local. Sera estendida para aceitar valores numericos (atualmente so aceita string). Ajuste: converter o tipo do parametro `value` para `string | number | null`.

**Componentes reutilizados:**
- `Input` de `@/components/ui/input` para os campos editaveis
- Estilizacao consistente com o tema escuro existente (bg-white/5, border-white/10, text-white)
